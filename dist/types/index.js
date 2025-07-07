/**
 * Raiy-PDCA TypeScript 型別定義
 */
// 匯出配置相關類型
export * from './config.js';
// 錯誤類型
export class PDCAError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'PDCAError';
    }
}
//# sourceMappingURL=index.js.map