/**
 * ============================================
 * LinkSnap - Lógica do Frontend
 * ============================================
 *
 * Responsável por:
 * - Encurtar URLs via Supabase
 * - Gerenciar histórico da sessão
 * - Copiar links para a área de transferência
 * - Validação de URLs
 */

(function () {
    'use strict';

    // ============================================
    // ELEMENTOS DO DOM
    // ============================================
    const urlInput = document.getElementById('urlInput');
    const shortenBtn = document.getElementById('shortenBtn');
    const resultSection = document.getElementById('resultSection');
    const shortUrlOutput = document.getElementById('shortUrlOutput');
    const copyBtn = document.getElementById('copyBtn');
    const openShortLink = document.getElementById('openShortLink');
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // ============================================
    // ESTADO
    // ============================================
    let sessionHistory = [];

    // ============================================
    // UTILITÁRIOS
    // ============================================

    /**
     * Gera um código curto aleatório
     * @param {number} length - Comprimento do código
     * @returns {string} Código alfanumérico
     */
    function generateShortCode(length = 6) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length];
        }
        return result;
    }

    /**
     * Valida se uma string é uma URL válida
     * @param {string} string - URL a validar
     * @returns {boolean} true se válida
     */
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Normaliza a URL (adiciona https:// se não tiver protocolo)
     * @param {string} url - URL original
     * @returns {string} URL normalizada
     */
    function normalizeUrl(url) {
        url = url.trim();
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
        }
        return url;
    }

    /**
     * Extrai o domínio de uma URL
     * @param {string} url - URL completa
     * @returns {string} Domínio
     */
    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    /**
     * Formata data para exibição
     * @param {Date} date - Data
     * @returns {string} Data formatada
     */
    function formatDate(date) {
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Obtém a URL base do site (para gerar link curto)
     * No GitHub Pages: https://usuario.github.io/repo/
     * @returns {string} URL base
     */
    function getBaseUrl() {
        const loc = window.location;
        return loc.origin + loc.pathname.replace(/\/[^/]*$/, '/') + 's/';
    }

    // ============================================
    // SUPABASE - BANCO DE DADOS
    // ============================================

    /**
     * Salva o link no Supabase
     * @param {string} originalUrl - URL original
     * @param {string} shortCode - Código curto
     * @returns {Promise<Object>} Dados salvos
     */
    async function saveLinkToSupabase(originalUrl, shortCode) {
        const { data, error } = await supabaseClient
            .from('links')
            .insert([{ original_url: originalUrl, short_code: shortCode }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar no Supabase:', error);
            throw new Error('Falha ao salvar o link. Tente novamente.');
        }

        return data;
    }

    /**
     * Verifica se o código curto já existe
     * @param {string} shortCode - Código a verificar
     * @returns {Promise<boolean>} true se existe
     */
    async function shortCodeExists(shortCode) {
        const { data, error } = await supabaseClient
            .from('links')
            .select('short_code')
            .eq('short_code', shortCode)
            .maybeSingle();

        if (error) {
            console.error('Erro ao verificar código:', error);
            return false;
        }

        return !!data;
    }

    /**
     * Busca a URL original pelo código curto
     * @param {string} shortCode - Código curto
     * @returns {Promise<string|null>} URL original ou null
     */
    async function getOriginalUrl(shortCode) {
        const { data, error } = await supabaseClient
            .from('links')
            .select('original_url, clicks')
            .eq('short_code', shortCode)
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar URL:', error);
            return null;
        }

        if (!data) return null;

        // Incrementa o contador de cliques (não bloqueia o redirect)
        supabaseClient
            .from('links')
            .update({ clicks: (data.clicks || 0) + 1 })
            .eq('short_code', shortCode)
            .then(({ error: updateError }) => {
                if (updateError) console.error('Erro ao atualizar cliques:', updateError);
            });

        return data.original_url;
    }

    // ============================================
    // UI - INTERFACE
    // ============================================

    /**
     * Mostra uma seção e esconde as outras
     * @param {HTMLElement} section - Seção a mostrar
     */
    function showSection(section) {
        resultSection.classList.add('hidden');
        loadingSection.classList.add('hidden');
        errorSection.classList.add('hidden');

        if (section) {
            section.classList.remove('hidden');
        }
    }

    /**
     * Exibe mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    function showError(message) {
        errorMessage.textContent = message;
        showSection(errorSection);
    }

    /**
     * Exibe o link encurtado gerado
     * @param {string} shortUrl - URL curta
     * @param {string} originalUrl - URL original
     */
    function displayShortUrl(shortUrl, originalUrl) {
        shortUrlOutput.value = shortUrl;
        openShortLink.href = shortUrl;
        showSection(resultSection);

        // Adiciona ao histórico
        addToHistory(originalUrl, shortUrl);
    }

    // ============================================
    // HISTÓRICO DA SESSÃO
    // ============================================

    /**
     * Adiciona link ao histórico
     * @param {string} originalUrl - URL original
     * @param {string} shortUrl - URL curta
     */
    function addToHistory(originalUrl, shortUrl) {
        const item = {
            id: Date.now(),
            originalUrl,
            shortUrl,
            createdAt: new Date(),
        };

        sessionHistory.unshift(item);
        renderHistory();
    }

    /**
     * Renderiza a lista de histórico
     */
    function renderHistory() {
        if (sessionHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-history">Nenhum link encurtado ainda.</p>';
            return;
        }

        historyList.innerHTML = sessionHistory.map(item => {
            const domain = getDomain(item.originalUrl);
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

            return `
                <div class="history-item" data-id="${item.id}">
                    <img src="${faviconUrl}" alt="" class="favicon" onerror="this.style.display='none'">
                    <div class="info">
                        <div class="original" title="${item.originalUrl}">${item.originalUrl}</div>
                        <div class="short">${item.shortUrl.replace('https://', '')}</div>
                    </div>
                    <div class="actions">
                        <button onclick="window.copyFromHistory('${item.shortUrl}', this)" title="Copiar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="window.open('${item.shortUrl}', '_blank')" title="Abrir">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button onclick="window.removeFromHistory(${item.id})" title="Remover">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Remove item do histórico
     * @param {number} id - ID do item
     */
    window.removeFromHistory = function (id) {
        sessionHistory = sessionHistory.filter(item => item.id !== id);
        renderHistory();
    };

    /**
     * Copia link do histórico
     * @param {string} url - URL a copiar
     * @param {HTMLElement} btn - Botão clicado
     */
    window.copyFromHistory = function (url, btn) {
        copyToClipboard(url, btn);
    };

    /**
     * Limpa todo o histórico
     */
    function clearHistory() {
        sessionHistory = [];
        renderHistory();
    }

    // ============================================
    // COPIAR PARA ÁREA DE TRANSFERÊNCIA
    // ============================================

    /**
     * Copia texto para a área de transferência
     * @param {string} text - Texto a copiar
     * @param {HTMLElement} btn - Botão (para feedback visual)
     */
    function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fas fa-check"></i><span>Copiado!</span>';

                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalHTML;
                }, 2000);
            }
        }).catch(() => {
            // Fallback para navegadores antigos
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i><span>Copiado!</span>';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 2000);
            }
        });
    }

    // ============================================
    // ENCURTAMENTO DE URL
    // ============================================

    /**
     * Função principal para encurtar URL
     */
    async function shortenUrl() {
        const rawInput = urlInput.value.trim();

        // Validação
        if (!rawInput) {
            showError('Por favor, cole um link para encurtar.');
            return;
        }

        const normalizedUrl = normalizeUrl(rawInput);

        if (!isValidUrl(normalizedUrl)) {
            showError('URL inválida. Verifique o formato e tente novamente.');
            return;
        }

        // Mostra loading
        showSection(loadingSection);
        shortenBtn.disabled = true;

        try {
            // Gera código curto único
            let shortCode;
            let attempts = 0;
            do {
                shortCode = generateShortCode(6);
                attempts++;
                // Se já existir, gera outro (máx 5 tentativas)
            } while (await shortCodeExists(shortCode) && attempts < 5);

            // Salva no Supabase
            await saveLinkToSupabase(normalizedUrl, shortCode);

            // Gera URL curta
            const shortUrl = getBaseUrl() + shortCode;

            // Exibe resultado
            displayShortUrl(shortUrl, normalizedUrl);

            // Limpa input
            urlInput.value = '';

        } catch (error) {
            showError(error.message || 'Erro ao encurtar o link. Tente novamente.');
        } finally {
            shortenBtn.disabled = false;
        }
    }

    // ============================================
    // EVENTOS
    // ============================================

    shortenBtn.addEventListener('click', shortenUrl);

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            shortenUrl();
        }
    });

    copyBtn.addEventListener('click', () => {
        copyToClipboard(shortUrlOutput.value, copyBtn);
    });

    clearHistoryBtn.addEventListener('click', clearHistory);

    // ============================================
    // INICIALIZAÇÃO
    // ============================================

    /**
     * Verifica se é uma URL curta e redireciona
     * Deve ser chamado quando alguém acessa o link curto
     */
    async function checkAndRedirect() {
        const path = window.location.pathname;
        const match = path.match(/\/s\/([a-zA-Z0-9]+)$/);

        if (match) {
            const shortCode = match[1];
            const originalUrl = await getOriginalUrl(shortCode);

            if (originalUrl) {
                window.location.href = originalUrl;
            } else {
                document.body.innerHTML = `
                    <div style="text-align:center;padding:4rem;font-family:system-ui;">
                        <h1>Link não encontrado</h1>
                        <p>O link curto que você acessou não existe ou foi removido.</p>
                        <a href="/" style="color:#6366f1;">Voltar ao início</a>
                    </div>
                `;
            }
        }
    }

    // Executa verificação de redirect na página atual
    checkAndRedirect();

})();
