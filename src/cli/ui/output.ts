import chalk from 'chalk';

export function banner(): void {
  console.log('');
  console.log(chalk.bold.cyan('UNICHANL'));
  console.log('');
}

export function section(title: string): void {
  console.log('');
  console.log(chalk.bold(title));
}

export function line(label: string, value: string, ok?: boolean): void {
  const dot = ok === undefined ? ' ' : ok ? chalk.green('●') : chalk.red('●');
  console.log(`${dot} ${chalk.dim(label.padEnd(24))} ${value}`);
}

export function ok(msg: string): void {
  console.log(`${chalk.green('✓')} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`${chalk.yellow('⚠')} ${msg}`);
}

export function fail(msg: string): void {
  console.log(`${chalk.red('✗')} ${msg}`);
}

export function info(msg: string): void {
  console.log(msg);
}

export function dim(msg: string): void {
  console.log(chalk.dim(msg));
}
