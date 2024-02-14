

const _ctx = {
    worker: null as Worker,
}

export const initVectorStore = async () => {
    if(!_ctx.worker) {
        _ctx.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module"} );
    }
    return _ctx.worker;
}

export const queryCommand = async (query) => {
    // const worker = await _initWorker();
    const worker = _ctx.worker;
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
            resolve(JSON.parse(e.data));
        }

        worker.onerror = (e) => {
            reject(e);
        }

        worker.postMessage({
            _vector: true,
            type: "command",
            query
        });
    });
}

export const queryAnchor = async (query) => {
    // const worker = await _initWorker();
    const worker = _ctx.worker;
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
            resolve(JSON.parse(e.data));
        }

        worker.onerror = (e) => {
            reject(e);
        }

        worker.postMessage({
            _vector: true,
            type: "anchor",
            query
        });
    });
}