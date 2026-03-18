// lib/init.js
// Responsável por executar tarefas de inicialização UMA ÚNICA VEZ
import { ensureDefaultAdmin } from './bootstrap';

let isInitialized = false;

export async function initializeSystem() {
  // Se já inicializou, não faz nada
  if (isInitialized) {
    return;
  }
  
  console.log('🚀 Inicializando o sistema...');
  console.time('initializeSystem');
  
  try {
    // Executa o ensureDefaultAdmin UMA ÚNICA VEZ na inicialização
    await ensureDefaultAdmin();
    
    isInitialized = true;
    console.timeEnd('initializeSystem');
    console.log('✅ Sistema inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar o sistema:', error);
    // Não marca como inicializado para tentar de novo no próximo deploy
    // Mas em dev, você pode querer ver o erro
    if (process.env.NODE_ENV === 'development') {
      console.error('Detalhes do erro:', error);
    }
  }
}

// Para uso em desenvolvimento - pode chamar manualmente se necessário
export function resetInitialization() {
  if (process.env.NODE_ENV === 'development') {
    isInitialized = false;
    console.log('🔄 Inicialização resetada (apenas desenvolvimento)');
  }
}