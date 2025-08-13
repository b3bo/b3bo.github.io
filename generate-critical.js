const critical = require('critical');

critical.generate({
  src: 'https://www.truesouthcoastalhomes.com/pcb/rivercamps-crooked-creek/',
  css: ['assets/css/tailwind.css'],
  width: 1300,
  height: 900,
  target: {
    css: 'assets/css/critical.css'
  }
}).then(() => {
  console.log('Critical CSS generated successfully!');
}).catch(err => {
  console.error('Error generating critical CSS:', err);
});