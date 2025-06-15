import chalk from "chalk";

export const logAccount = (msg) => console.log(chalk.hex("#A259FF")(`🟣 ${msg}`)); 
export const logCache = (msg) => console.log(chalk.hex("#FF8C00")(`🟡 ${msg}`)); 
export const logInfo = (msg) => console.log(chalk.hex("#48D1CC")(`🔵 ${msg}`)); 
export const logSuccess = (msg) => console.log(chalk.hex("#00FF00")(`🟢 ${msg}`)); 
export const logError = (msg) => console.log(chalk.hex("#FF6347")(`🔴 ${msg}`)); 
