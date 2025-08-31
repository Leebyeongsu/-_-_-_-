// MCP (Model Context Protocol) 클라이언트 통합
import { supabase, initializeSupabase } from './supabase-config.js';

class MCPClient {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.isInitialized = false;
    }

    // Supabase 클라이언트 초기화
    async initialize() {
        try {
            if (this.isInitialized) return this.supabase;
            
            // Supabase 클라이언트가 아직 초기화되지 않았다면 대기
            if (!supabase) {
                console.log('Supabase 클라이언트 초기화 대기 중...');
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (supabase) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            this.supabase = supabase;
            this.isInitialized = true;
            console.log('MCP 클라이언트 초기화 완료');
            return this.supabase;
        } catch (error) {
            console.error('MCP 클라이언트 초기화 실패:', error);
            throw error;
        }
    }

    // MCP 서버 연결 상태 확인
    async checkConnection() {
        try {
            await this.initialize();
            
            const { data, error } = await this.supabase.from('admin_settings').select('count').limit(1);
            this.isConnected = !error;
            return { success: !error, error };
        } catch (error) {
            this.isConnected = false;
            return { success: false, error: error.message };
        }
    }

    // MCP를 통한 데이터베이스 쿼리 실행
    async executeQuery(query, params = {}) {
        try {
            await this.initialize();
            
            // SQL 쿼리 실행 (Supabase의 rpc 함수 사용)
            const { data, error } = await this.supabase.rpc('execute_sql', {
                query_text: query,
                query_params: params
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('MCP 쿼리 실행 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // MCP를 통한 스키마 정보 조회
    async getSchemaInfo() {
        try {
            await this.initialize();
            
            const { data, error } = await this.supabase
                .from('information_schema.tables')
                .select('table_name, table_type')
                .eq('table_schema', 'public');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('스키마 정보 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // MCP를 통한 테이블 데이터 조회
    async getTableData(tableName, limit = 100) {
        try {
            await this.initialize();
            
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error(`테이블 ${tableName} 데이터 조회 실패:`, error);
            return { success: false, error: error.message };
        }
    }

    // MCP를 통한 데이터 삽입
    async insertData(tableName, data) {
        try {
            await this.initialize();
            
            const { data: result, error } = await this.supabase
                .from(tableName)
                .insert(data)
                .select();

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`테이블 ${tableName} 데이터 삽입 실패:`, error);
            return { success: false, error: error.message };
        }
    }

    // MCP를 통한 데이터 업데이트
    async updateData(tableName, data, conditions) {
        try {
            await this.initialize();
            
            let query = this.supabase.from(tableName).update(data);
            
            // 조건 적용
            Object.keys(conditions).forEach(key => {
                query = query.eq(key, conditions[key]);
            });

            const { data: result, error } = await query.select();
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`테이블 ${tableName} 데이터 업데이트 실패:`, error);
            return { success: false, error: error.message };
        }
    }

    // MCP를 통한 데이터 삭제
    async deleteData(tableName, conditions) {
        try {
            await this.initialize();
            
            let query = this.supabase.from(tableName).delete();
            
            // 조건 적용
            Object.keys(conditions).forEach(key => {
                query = query.eq(key, conditions[key]);
            });

            const { data: result, error } = await query.select();
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`테이블 ${tableName} 데이터 삭제 실패:`, error);
            return { success: false, error: error.message };
        }
    }

    // MCP 상태 정보 반환
    getStatus() {
        return {
            isConnected: this.isConnected,
            isInitialized: this.isInitialized,
            supabaseUrl: this.supabase?.supabaseUrl || '초기화 중...',
            timestamp: new Date().toISOString()
        };
    }
}

// MCP 클라이언트 인스턴스 생성 및 내보내기
export const mcpClient = new MCPClient();

// 전역 객체에 MCP 클라이언트 등록 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.mcpClient = mcpClient;
}
