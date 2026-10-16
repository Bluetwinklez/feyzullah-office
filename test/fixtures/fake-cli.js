// Sahte CLI: argv[2] = motor; stdin ya da -p argümanı = talimat; ilgili JSON akışını basar.
const [engine, ...args] = process.argv.slice(2);
let input = '';
const done = () => {
  const prompt = engine === 'antigravity' ? args[args.indexOf('-p') + 1] : input;
  const say = (o) => process.stdout.write(`${JSON.stringify(o)}\n`);
  const reply = `cevap(${prompt.length})${args.includes('--resume') || args.includes('resume') || args.includes('--conversation') ? ' devam' : ''}`;
  if (engine === 'claude') {
    say({ type: 'system', subtype: 'init', session_id: 'cs-1' });
    say({ type: 'rate_limit_event', rate_limit_info: { utilization: 0.5, resetsAt: 9, rateLimitType: 'five_hour' } });
    say({ type: 'assistant', message: { content: [{ type: 'text', text: reply }] } });
    say({ type: 'result', subtype: 'success', is_error: false, result: reply, session_id: 'cs-1', usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 }, total_cost_usd: 0.01 });
  } else if (engine === 'codex') {
    say({ type: 'thread.started', thread_id: 'cx-1' });
    say({ type: 'item.completed', item: { type: 'agent_message', text: reply } });
    say({ type: 'turn.completed', usage: { input_tokens: 300, cached_input_tokens: 100, output_tokens: 40 } });
  } else {
    say({ event: 'init', conversation_id: 'ag-1' });
    say({ event: 'step_update', step_update: { step_type: 'agent_response', text_delta: reply } });
    say({ event: 'result', result: { conversation_id: 'ag-1', status: 'SUCCESS', response: reply } });
  }
  process.stdout.write(JSON.stringify({ argv: args }) + '\n');
};
if (engine === 'antigravity') done(); else { process.stdin.on('data', (c) => { input += c; }); process.stdin.on('end', done); }
