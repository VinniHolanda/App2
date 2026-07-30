import { Client, ClassBooking } from '../types';

export interface StudentClassStats {
  totalClasses: number;
  completedClasses: number;
  absencesCount: number;
  replacementEligibleAbsences: number; // Faltas com direito a reposição
  replacementCreditsAvailable: number; // Faltas com direito que ainda não foram repostas
  replacementClassesDoneOrScheduled: number; // Reposições agendadas ou concluídas
  cancelledCount: number;
  upcomingClasses: number; // Agendadas para o futuro
  frequencyPercentage: number; // % de presença sobre aulas passadas
}

export function calculateStudentClassStats(client: Client): StudentClassStats {
  const bookings: ClassBooking[] = client.classBookings || [];
  const totalClasses = bookings.length;

  let completedClasses = 0;
  let absencesCount = 0;
  let replacementEligibleAbsences = 0;
  let replacementCreditsAvailable = 0;
  let replacementClassesDoneOrScheduled = 0;
  let cancelledCount = 0;
  let upcomingClasses = 0;

  bookings.forEach(b => {
    if (b.status === 'realizada') {
      completedClasses++;
      if (b.isMakeupClass) {
        replacementClassesDoneOrScheduled++;
      }
    } else if (b.status === 'falta') {
      absencesCount++;
      if (b.allowsReplacement) {
        replacementEligibleAbsences++;
        if (!b.replacementUsed) {
          replacementCreditsAvailable++;
        }
      }
    } else if (b.status === 'agendada' || b.status === 'reposicao_agendada') {
      upcomingClasses++;
      if (b.isMakeupClass || b.status === 'reposicao_agendada') {
        replacementClassesDoneOrScheduled++;
      }
    } else if (b.status === 'cancelada') {
      cancelledCount++;
    }
  });

  const evaluatedPastClasses = completedClasses + absencesCount;
  const frequencyPercentage = evaluatedPastClasses > 0 
    ? Math.round((completedClasses / evaluatedPastClasses) * 100) 
    : 100;

  return {
    totalClasses,
    completedClasses,
    absencesCount,
    replacementEligibleAbsences,
    replacementCreditsAvailable,
    replacementClassesDoneOrScheduled,
    cancelledCount,
    upcomingClasses,
    frequencyPercentage
  };
}

export function getAllTrainerClassBookings(clients: Client[]): ClassBooking[] {
  const allBookings: ClassBooking[] = [];
  clients.forEach(client => {
    if (client.classBookings && client.classBookings.length > 0) {
      client.classBookings.forEach(b => {
        allBookings.push({
          ...b,
          clientId: client.id,
          clientName: client.name
        });
      });
    }
  });
  
  // Sort chronologically (date + time)
  return allBookings.sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time || '00:00'}`;
    const dateTimeB = `${b.date}T${b.time || '00:00'}`;
    return dateTimeA.localeCompare(dateTimeB);
  });
}
