
let endpoint: null | string = null;
export const getEndpoint = (): string => {
    if (endpoint)
        return endpoint;

    let hostname = "https://army-thing.fly.dev";
    let port = null;
    if (window.location.href.includes('localhost')) {
        hostname = 'http://localhost';
        port = 3000;
    }
    endpoint = port ? `${hostname}:${port}` : hostname;
    return endpoint;
}
