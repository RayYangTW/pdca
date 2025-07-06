/**
 * PDCA-Shokunin TypeScript 型別定義
 */
// 錯誤類型
export class ShokuninError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ShokuninError';
    }
}
//# sourceMappingURL=index.js.map