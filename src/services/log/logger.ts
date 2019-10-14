import ENV from '../env';

interface Log {
  file: string;
  caller: string;
  value: unknown;
  important?: boolean;
  trace?: boolean;
  warn?: boolean;
  error?: boolean;
}

/**
 * Custom logging function with custom styling and tracing
 * @param logOptions `file`, `caller`, and `value` are required
 * - options:
 * ```ts
  file: string;
  caller: string;
  value: unknown;
  important?: boolean;
  trace?: boolean;
  warn?: boolean; // console.warn
  error?: boolean; // console.error
 * ```
 */
export default function log(logOptions: Log): void {
  if (ENV.isProduction) return;
  const {
    file = '',
    caller = '',
    value = {},
    important = false,
    trace = false,
    warn = false,
    error = false
  } = logOptions;

  const info = `${file} - ${caller}:`;

  if (trace) console.trace(info);
  if (error) {
    return console.error(info, value);
  }
  if (warn) {
    return console.warn(info, value);
  }
  if (important) {
    console.log(
      `%c${info}`, // everything after the %c is styled
      `color: red; font-weight: bold;`,
      value
    );
  } else {
    console.log(info, value);
  }
}
