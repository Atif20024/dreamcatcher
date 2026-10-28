// Node module hook for the atlas build: `phaser` (which needs a browser to
// import) resolves to a small stub, so the runtime's string-art modules can
// run headless and be captured into placeholder atlases.
export async function resolve(specifier, context, next) {
  if (specifier === 'phaser') return { url: new URL('./phaser-stub.js', import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
