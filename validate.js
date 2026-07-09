const fs = require('fs');
const html = fs.readFileSync('energy-resilience-all-in-one.html', 'utf8');
const idx = html.indexOf('<script type="text/babel">');
if (idx >= 0) {
  const end = html.indexOf('</script>', idx);
  const code = html.substring(idx + 25, end);
  try {
    new Function(code);
    console.log('Syntax OK - ' + code.split('\n').length + ' lines');
  } catch(e) {
    console.log('Syntax error:', e.message);
  }
} else {
  console.log('Script block not found');
}
