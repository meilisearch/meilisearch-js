async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

let warningDispatched = false;
function addProtocolIfNotPresent(host: string): string {
  if (/^https?:\/\//.test(host)) {
    return host;
  }

  if (!warningDispatched) {
    console.warn(
      `DEPRECATION WARNING: missing protocol in provided host ${host} will no longer be supported in the future`,
    );
    warningDispatched = true;
  }

  return `http://${host}`;
}

export { sleep, addProtocolIfNotPresent };
