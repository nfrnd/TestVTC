// Prints every business fact still unknown: npm run content:report
import { contentGaps } from '../src/content/readiness';
const gaps = contentGaps();
for (const g of gaps) console.log(`${g.critical ? '[BLOQUANT]' : '[à compléter]'} ${g.path} : ${g.note}`);
console.log(`\n${gaps.length} éléments, dont ${gaps.filter((g) => g.critical).length} bloquants pour la production.`);
