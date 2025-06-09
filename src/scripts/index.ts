import * as Logger from './utils/logger';

Logger.logHeader('NexPhys CLI');
Logger.logInfo('NexPhys komut satırı arayüzünü kullanmak için:');
Logger.logListItem('npm run build - CLI\'ı derlemek için');
Logger.logListItem('npm link - CLI\'ı global olarak erişilebilir yapmak için');
Logger.logListItem('nexphys --help - Komutları görüntülemek için');

console.log('\nÖrnek komutlar:');
console.log('  nexphys tenant:create -d my-gym -n "My Gym" -t GYM -e admin@my-gym.com');
console.log('  nexphys setup:dev --clean --seed');
console.log('  nexphys schema:create -d my-gym\n');

Logger.logInfo('Daha fazla bilgi için: nexphys-backend/src/scripts/README.md'); 