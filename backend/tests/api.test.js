"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importStar(require("../src/index"));
const prismaClient_1 = __importDefault(require("../src/prismaClient"));
beforeAll(async () => {
    // Clear the DB before tests
    await prismaClient_1.default.transaction.deleteMany({});
    await prismaClient_1.default.category.deleteMany({});
});
afterAll(async () => {
    await prismaClient_1.default.$disconnect();
    index_1.server.close();
});
describe('API Integration Tests', () => {
    let categoryId;
    it('GET /api/health should return ok', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
    it('POST /api/categories should create a new category', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/categories')
            .send({ name: '식비', type: 'EXPENSE' });
        expect(res.status).toBe(201);
        expect(res.body.name).toBe('식비');
        categoryId = res.body.id;
    });
    it('POST /api/transactions should create a new transaction', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/transactions')
            .send({
            amount: 8000,
            type: 'EXPENSE',
            date: new Date().toISOString(),
            memo: '점심 식사',
            categoryId,
        });
        expect(res.status).toBe(201);
        expect(res.body.amount).toBe(8000);
        expect(res.body.category.id).toBe(categoryId);
    });
    it('GET /api/transactions should return transactions list', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/api/transactions');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].amount).toBe(8000);
    });
});
//# sourceMappingURL=api.test.js.map