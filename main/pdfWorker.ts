import * as ops from './pdfOps';

type PdfTaskName = ops.PdfTaskName;

interface TaskMessage {
  id: number;
  task: PdfTaskName;
  args: unknown[];
}

process.on('message', (msg: TaskMessage) => {
  const handler = (ops as unknown as Record<string, (...a: unknown[]) => Promise<unknown> | unknown>)[msg.task];
  if (typeof handler !== 'function') {
    process.send?.({ id: msg.id, error: `Bilinmeyen görev: ${msg.task}` });
    return;
  }
  Promise.resolve()
    .then(() => handler(...msg.args))
    .then((result) => process.send?.({ id: msg.id, result }))
    .catch((err: unknown) => process.send?.({ id: msg.id, error: err instanceof Error ? err.stack || err.message : String(err) }));
});
