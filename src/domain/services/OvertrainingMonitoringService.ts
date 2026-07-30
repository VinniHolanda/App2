import { Client, Session } from '../types';
import { calculateWeekStats } from '../calculators/loadCalculators';

export interface InjuryRiskNotification {
  id: string;
  clientId: string;
  clientName: string;
  type: 'monotony_critical' | 'strain_critical' | 'acwr_spike' | 'srpe_divergence' | 'joint_pain_alert';
  severity: 'critical' | 'warning';
  title: string;
  message: string;
  metricValue: string;
  threshold: string;
  recommendedAction: string;
  timestamp: string;
  read?: boolean;
}

export class OvertrainingMonitoringService {
  /**
   * Critical Injury Risk Thresholds based on Foster (1998) & Gabbett (2016) ACWR model
   */
  public static THRESHOLDS = {
    MONOTONY_CRITICAL: 2.0,      // Monotonia > 2.0 = Risco de estagnação e estresse celular
    MONOTONY_WARNING: 1.8,       // Monotonia > 1.8 = Baixa variação de estímulo
    STRAIN_CRITICAL: 6000,       // Tensão de Foster > 6000 UA = Sobrecarga sistêmica grave
    STRAIN_WARNING: 4500,        // Tensão de Foster > 4500 UA = Zona de fadiga acumulada
    ACWR_CRITICAL: 1.50,         // ACWR >= 1.50 = Zona Vermelha (Pico de carga / Risco de Lesão 2x a 4x)
    ACWR_WARNING: 1.35,          // ACWR >= 1.35 = Zona de Alerta
    SRPE_CRITICAL_DIVERGENCE: 8.5 // sRPE >= 8.5 com queda de tonelagem = Fadiga Central
  };

  /**
   * Evaluates a single client and returns any active injury risk notifications
   */
  public static evaluateClientRisk(client: Client): InjuryRiskNotification[] {
    const notifications: InjuryRiskNotification[] = [];
    if (!client) return notifications;

    const sessions: Session[] = client.rpeLog || [];
    const nowIso = new Date().toISOString();

    // 1. Calculate weekly stats for the recent sessions
    const weekStats = calculateWeekStats(sessions);

    if (weekStats) {
      // --- CHECK 1: MONOTONIA (Monotony) ---
      if (weekStats.monotony != null) {
        if (weekStats.monotony >= this.THRESHOLDS.MONOTONY_CRITICAL) {
          notifications.push({
            id: `alert-mono-${client.id}-${Date.now()}`,
            clientId: client.id,
            clientName: client.name,
            type: 'monotony_critical',
            severity: 'critical',
            title: `🚨 Monotonia Crítica de Carga (${weekStats.monotony})`,
            message: `O atleta ${client.name} apresenta baixíssima variação na carga diária de treino. Falta de ondulação de carga gera sobrecarga em tecidos moles.`,
            metricValue: `Monotonia: ${weekStats.monotony}`,
            threshold: `Limite seguro < ${this.THRESHOLDS.MONOTONY_CRITICAL}`,
            recommendedAction: 'Variar a intensidade dos treinos da semana (ex: intercalar dias pesados de 8-9 sRPE com dias leves de 5-6 sRPE ou cardio regenerativo).',
            timestamp: nowIso
          });
        } else if (weekStats.monotony >= this.THRESHOLDS.MONOTONY_WARNING) {
          notifications.push({
            id: `alert-mono-warn-${client.id}-${Date.now()}`,
            clientId: client.id,
            clientName: client.name,
            type: 'monotony_critical',
            severity: 'warning',
            title: `⚠️ Alerta de Monotonia (${weekStats.monotony})`,
            message: `Padrão repetitivo de carga detectado para ${client.name}.`,
            metricValue: `Monotonia: ${weekStats.monotony}`,
            threshold: `Ideal < ${this.THRESHOLDS.MONOTONY_WARNING}`,
            recommendedAction: 'Programar ondulação de volume e RPE no meio da semana.',
            timestamp: nowIso
          });
        }
      }

      // --- CHECK 2: FOSTER STRAIN INDEX (Tensão de Foster) ---
      if (weekStats.strain != null) {
        if (weekStats.strain >= this.THRESHOLDS.STRAIN_CRITICAL) {
          notifications.push({
            id: `alert-[#00f0ff]-strain-${client.id}-${Date.now()}`,
            clientId: client.id,
            clientName: client.name,
            type: 'strain_critical',
            severity: 'critical',
            title: `🚨 Índice de Tensão de Foster Crítico (${weekStats.strain.toLocaleString('pt-BR')} UA)`,
            message: `Carga semanal total multiplicada pela monotonia atingiu nível de estresse metabólico elevado. Risco iminente de overtraining não-funcional.`,
            metricValue: `Tensão: ${weekStats.strain.toLocaleString('pt-BR')} UA`,
            threshold: `Limite < ${this.THRESHOLDS.STRAIN_CRITICAL.toLocaleString('pt-BR')} UA`,
            recommendedAction: 'Prescrever Deload imediato de 30% a 40% nas próximas 2 a 3 sessões.',
            timestamp: nowIso
          });
        } else if (weekStats.strain >= this.THRESHOLDS.STRAIN_WARNING) {
          notifications.push({
            id: `alert-strain-warn-${client.id}-${Date.now()}`,
            clientId: client.id,
            clientName: client.name,
            type: 'strain_critical',
            severity: 'warning',
            title: `⚡ Tensão de Foster Elevada (${weekStats.strain.toLocaleString('pt-BR')} UA)`,
            message: `Acúmulo de fadiga detectado para ${client.name}.`,
            metricValue: `Tensão: ${weekStats.strain.toLocaleString('pt-BR')} UA`,
            threshold: `Ideal < ${this.THRESHOLDS.STRAIN_WARNING.toLocaleString('pt-BR')} UA`,
            recommendedAction: 'Monitorar sono e nutrição do atleta antes da próxima sessão pesada.',
            timestamp: nowIso
          });
        }
      }
    }

    // --- CHECK 3: ACWR (Acute:Chronic Workload Ratio) ---
    // Group sessions by week index
    const weekLoads: number[] = [0, 0, 0, 0, 0, 0];
    const weekTonnage: number[] = [0, 0, 0, 0, 0, 0];
    const weekSrpeSum: number[] = [0, 0, 0, 0, 0, 0];
    const weekSrpeCount: number[] = [0, 0, 0, 0, 0, 0];

    if (sessions.length > 0) {
      sessions.forEach(s => {
        const wIdx = (s.week != null && s.week >= 0 && s.week < 6) ? s.week : 0;
        const min = s.min || 60;
        const srpe = s.srpe || 7;
        const load = srpe * min;

        weekLoads[wIdx] += load;
        weekTonnage[wIdx] += (s.tonnage || 0);
        weekSrpeSum[wIdx] += srpe;
        weekSrpeCount[wIdx] += 1;
      });
    }

    // Acute (latest week with sessions) vs Chronic (previous 4 weeks average)
    const acuteLoad = weekLoads[4] || weekLoads[3] || (sessions.length > 0 ? 1800 : 0);
    const chronicLoadsList = weekLoads.slice(0, 4).filter(l => l > 0);
    const chronicLoad = chronicLoadsList.length > 0
      ? chronicLoadsList.reduce((a, b) => a + b, 0) / chronicLoadsList.length
      : (acuteLoad > 0 ? acuteLoad * 0.8 : 0);

    if (acuteLoad > 0 && chronicLoad > 0) {
      const acwr = parseFloat((acuteLoad / chronicLoad).toFixed(2));

      if (acwr >= this.THRESHOLDS.ACWR_CRITICAL) {
        notifications.push({
          id: `alert-acwr-${client.id}-${Date.now()}`,
          clientId: client.id,
          clientName: client.name,
          type: 'acwr_spike',
          severity: 'critical',
          title: `🚨 Pico de Carga ACWR (${acwr}x)`,
          message: `A carga dos últimos 7 dias cresceu desproporcionalmente em relação à média das 4 semanas anteriores. Probabilidade de lesão aumentada em até 300%.`,
          metricValue: `ACWR: ${acwr}`,
          threshold: `Zona Segura: 0.80 a ${this.THRESHOLDS.ACWR_WARNING}`,
          recommendedAction: 'Interromper progressão de carga e inserir sessão de regeneração.',
          timestamp: nowIso
        });
      } else if (acwr >= this.THRESHOLDS.ACWR_WARNING) {
        notifications.push({
          id: `alert-acwr-warn-${client.id}-${Date.now()}`,
          clientId: client.id,
          clientName: client.name,
          type: 'acwr_spike',
          severity: 'warning',
          title: `⚡ Razão ACWR no Limite da Zona de Perigo (${acwr}x)`,
          message: `O atleta ${client.name} está no limite superior da taxa de progressão segura de carga.`,
          metricValue: `ACWR: ${acwr}`,
          threshold: `Atenção se > ${this.THRESHOLDS.ACWR_WARNING}`,
          recommendedAction: 'Manter a carga estabilizada na próxima semana para consolidar a adaptação crônica.',
          timestamp: nowIso
        });
      }
    }

    // --- CHECK 4: sRPE vs TONNAGE DIVERGENCE (Central Fatigue) ---
    const recentSrpe = weekSrpeCount[4] > 0 ? weekSrpeSum[4] / weekSrpeCount[4] : (sessions.length > 0 ? sessions[sessions.length - 1].srpe : 0);
    const prevTonnage = weekTonnage[3] || 0;
    const currentTonnage = weekTonnage[4] || 0;

    if (recentSrpe >= this.THRESHOLDS.SRPE_CRITICAL_DIVERGENCE && prevTonnage > 0 && currentTonnage < prevTonnage * 0.90) {
      notifications.push({
        id: `alert-div-${client.id}-${Date.now()}`,
        clientId: client.id,
        clientName: client.name,
        type: 'srpe_divergence',
        severity: 'critical',
        title: `🚨 Divergência sRPE x Desempenho (sRPE ${recentSrpe.toFixed(1)}/10 com Queda de Volume)`,
        message: `O atleta relatou esforço percebido altíssimo enquanto a tonelagem total caiu mais de 10%. Forte indicativo de fadiga do SNC ou insônia/estresse metabólico.`,
        metricValue: `sRPE: ${recentSrpe.toFixed(1)}/10`,
        threshold: `Divergência detectada`,
        recommendedAction: 'Avaliar questionário de Wellness (qualidade de sono, dor muscular tardia e nível de estresse extra-treino).',
        timestamp: nowIso
      });
    }

    // --- CHECK 5: ACUTE JOINT PAIN IN RECENT WORKOUT / WELLNESS ---
    const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    if (lastSession && lastSession.notes && /dor|incômodo|desconforto|ombro|joelho|coluna|punho|fisgada/i.test(lastSession.notes)) {
      notifications.push({
        id: `alert-pain-${client.id}-${Date.now()}`,
        clientId: client.id,
        clientName: client.name,
        type: 'joint_pain_alert',
        severity: 'warning',
        title: `📝 Relato de Incômodo/Dor em Nota Pós-Treino`,
        message: `O aluno anotou: "${lastSession.notes.slice(0, 100)}..."`,
        metricValue: `Feedback no Treino`,
        threshold: `Análise Biomecânica Necessária`,
        recommendedAction: 'Verificar execução do exercício ou substituir padrão de movimento no programa.',
        timestamp: nowIso
      });
    }

    return notifications;
  }

  /**
   * Evaluates all clients in the system and returns all active risk notifications
   */
  public static evaluateAllClients(clients: Client[]): InjuryRiskNotification[] {
    const allNotifications: InjuryRiskNotification[] = [];
    clients.forEach(client => {
      const clientRiskList = this.evaluateClientRisk(client);
      allNotifications.push(...clientRiskList);
    });
    return allNotifications;
  }

  /**
   * Checks a finished session for critical risks and posts automated alert messages into client.trainerChat
   */
  public static processSessionForTrainerAlerts(client: Client, session: Session): {
    updatedClient: Client;
    criticalAlertsTriggered: InjuryRiskNotification[];
  } {
    const risks = this.evaluateClientRisk(client);
    const criticalRisks = risks.filter(r => r.severity === 'critical');

    if (criticalRisks.length === 0) {
      return { updatedClient: client, criticalAlertsTriggered: [] };
    }

    // Ensure trainerChat array exists
    const updatedClient = { ...client };
    if (!updatedClient.trainerChat) updatedClient.trainerChat = [];

    // Avoid duplicate system alerts within same session window
    criticalRisks.forEach(risk => {
      const existingAlert = updatedClient.trainerChat?.find(
        msg => msg.from === 'trainer' && msg.text.includes(risk.title)
      );

      if (!existingAlert) {
        updatedClient.trainerChat?.push({
          id: `sys-alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          from: 'trainer',
          text: `🚨 [SISTEMA - ALERTA DE OVERTRAINING DETECTADO]\n\nAtleta: ${risk.clientName}\nMotivo: ${risk.title}\nDetalhes: ${risk.message}\n\n👉 Recomendação do Sistema: ${risk.recommendedAction}`,
          date: new Date().toISOString()
        });
      }
    });

    return {
      updatedClient,
      criticalAlertsTriggered: criticalRisks
    };
  }

  /**
   * Calculates recent monotony status for a student card
   */
  public static getClientMonotonyStatus(client: Client): {
    monotony: number | null;
    inRiskZone: boolean;
    severity: 'critical' | 'warning' | 'normal';
    label: string;
  } {
    if (!client) {
      return { monotony: null, inRiskZone: false, severity: 'normal', label: 'Sem dados' };
    }

    const sessions = client.rpeLog || [];
    const weekStats = calculateWeekStats(sessions);

    let monotony = weekStats?.monotony ?? null;

    // Check if evaluateClientRisk produced a monotony notification
    const risks = this.evaluateClientRisk(client);
    const monoNotification = risks.find(r => r.type === 'monotony_critical' || r.title.includes('Monotonia'));

    if (monoNotification) {
      monotony = parseFloat(monoNotification.metricValue.replace(/[^0-9.]/g, '')) || 2.1;
    } else if (monotony == null && sessions.length > 0) {
      const srpes = sessions.map(s => s.srpe || 7);
      const mean = srpes.reduce((a, b) => a + b, 0) / srpes.length;
      const sd = Math.sqrt(srpes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / srpes.length);
      monotony = sd > 0.01 ? parseFloat((mean / sd).toFixed(2)) : (sessions.length > 1 ? 2.1 : 1.85);
    }

    const inRiskZone = (monotony != null && monotony >= this.THRESHOLDS.MONOTONY_WARNING) || !!monoNotification;
    let severity: 'critical' | 'warning' | 'normal' = 'normal';
    let label = 'Zona Segura';

    if (monotony != null && monotony >= this.THRESHOLDS.MONOTONY_CRITICAL) {
      severity = 'critical';
      label = 'Monotonia Crítica';
    } else if (inRiskZone) {
      severity = 'warning';
      label = 'Monotonia Elevada';
    }

    return {
      monotony,
      inRiskZone,
      severity,
      label
    };
  }
}
