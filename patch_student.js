import fs from 'fs';
const path = 'src/presentation/views/StudentPortalView.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetImport = "import { StudentBadgesWidget } from '../components/student/StudentBadgesWidget';";
const replImport = `import { StudentBadgesWidget } from '../components/student/StudentBadgesWidget';
import { WeeklyComparisonChart } from '../components/student/WeeklyComparisonChart';
import { PersonalRecordsPanel } from '../components/student/PersonalRecordsPanel';`;

if(content.includes(targetImport)) {
  content = content.replace(targetImport, replImport);
}

const targetTab1 = `<StudentBadgesWidget client={vm.client} />`;
const replTab1 = `<div className="space-y-6">
              <StudentBadgesWidget client={vm.client} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WeeklyComparisonChart sessions={vm.client.rpeLog || []} />
                <PersonalRecordsPanel sessions={vm.client.rpeLog || []} />
              </div>
            </div>`;

// Since targetTab1 appears twice, let's just do a string replace all using regex
content = content.replace(new RegExp(targetTab1.replace(/[.*+?^$\{key\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), replTab1);

fs.writeFileSync(path, content, 'utf8');
