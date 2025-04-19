const chalk = require('chalk');

const welcomeskw = chalk.hex('#00CED1')(`
   ███████╗██╗  ██╗██╗    ██╗
   ██╔════╝██║ ██╔╝██║    ██║
   ███████╗█████╔╝ ██║ █╗ ██║
   ╚════██║██╔═██╗ ██║███╗██║
   ███████║██║  ██╗╚███╔███╔╝
   ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ 
`);

function displayskw() {
  console.log(welcomeskw);
  console.log(chalk.hex('#00CED1')(" ╔══════════════════════════════════════════════════════════════╗"));
  console.log(chalk.hex('#00CED1')(" ║ ≣  Fitur Autobot by SKW AIRDROP HUNTER                       ║"));
  console.log(chalk.hex('#00CED1')(" ║══════════════════════════════════════════════════════════════║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Auto Claim Faucet BTC ETH USDT                           ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Auto Swap                                                ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Auto Add, Remove LP & Increase LP                        ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Multi Akun                                               ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Sudah Pasti Elig                                         ║"));
  console.log(chalk.hex('#00CED1')(" ╚══════════════════════════════════════════════════════════════╝"));
  console.log(chalk.hex('#00CED1')("   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"));
  console.log();
}

module.exports = { displayskw };
