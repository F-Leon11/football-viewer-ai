class FootballApp {
    constructor() {
        this.partidos = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAllMatches();
    }

    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const clearBtn = document.getElementById('clearBtn');
        const loadAllBtn = document.getElementById('loadAllBtn');
        const searchInput = document.getElementById('searchInput');

        searchBtn.addEventListener('click', () => this.searchWithAI());
        clearBtn.addEventListener('click', () => this.clearSearch());
        loadAllBtn.addEventListener('click', () => this.loadAllMatches());

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWithAI();
            }
        });
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('error').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        this.hideLoading();
    }

    async loadAllMatches() {
        this.showLoading();
        this.clearSearchInfo();

        try {
            const response = await fetch('/partidos');
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.partidos = data.partidos;
            this.renderMatches(this.partidos);
            this.updateFilterInfo(`Mostrando ${this.partidos.length} partidos`);
            this.hideLoading();

        } catch (error) {
            this.showError('Error al cargar los partidos: ' + error.message);
        }
    }

    async searchWithAI() {
        const query = document.getElementById('searchInput').value.trim();

        if (!query) {
            this.showError('Por favor, introduce una búsqueda');
            return;
        }

        this.showLoading();
        this.clearSearchInfo();

        try {
            const response = await fetch('/buscar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query })
            });

            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.partidos = data.partidos;
            this.renderMatches(this.partidos);
            this.showSearchInfo(query, data.total_found, data.filter_applied, data.competition);
            this.hideLoading();

        } catch (error) {
            this.showError('Error en la búsqueda: ' + error.message);
        }
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.clearSearchInfo();
        this.loadAllMatches();
    }

    showSearchInfo(query, totalFound, filterApplied, competition) {
        const infoDiv = document.getElementById('searchInfo');
        let filterText = '';

        if (filterApplied.team) {
            filterText += `Equipo: ${filterApplied.team}`;
        }
        if (filterApplied.status) {
            filterText += (filterText ? ', ' : '') + `Estado: ${this.translateStatus(filterApplied.status)}`;
        }
        if (filterApplied.action === 'show_all') {
            filterText = 'Todos los partidos';
        }

        infoDiv.innerHTML = `
            <i class="fas fa-search"></i>
            Búsqueda: "${query}" | Liga: ${competition || 'Premier League'} | Filtros: ${filterText} | Resultados: ${totalFound}
        `;
        infoDiv.classList.remove('hidden');
    }

    clearSearchInfo() {
        document.getElementById('searchInfo').classList.add('hidden');
    }

    updateFilterInfo(text) {
        document.getElementById('filterInfo').textContent = text;
    }

    renderMatches(matches) {
        const container = document.getElementById('partidos-container');

        if (matches.length === 0) {
            container.innerHTML = `
                <div class="no-matches" style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 15px; color: #666;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; color: #ddd;"></i>
                    <h3>No se encontraron partidos</h3>
                    <p>Intenta con otra búsqueda o carga todos los partidos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = matches.map(match => this.createMatchCard(match)).join('');

        // Bind events para botones de detalles
        container.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchId = e.target.getAttribute('data-match-id');
                this.toggleDetails(matchId);
            });
        });
    }

    createMatchCard(match) {
        const date = new Date(match.utcDate);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = match.status.toLowerCase();
        const statusText = this.translateStatus(match.status);

        let scoreDisplay = '';
        let homeWinner = '';
        let awayWinner = '';

        if (match.status === 'FINISHED' && match.score && match.score.fullTime) {
            const homeScore = match.score.fullTime.home || 0;
            const awayScore = match.score.fullTime.away || 0;
            scoreDisplay = `${homeScore} - ${awayScore}`;

            if (homeScore > awayScore) {
                homeWinner = 'winner';
            } else if (awayScore > homeScore) {
                awayWinner = 'winner';
            }
        } else if (match.status === 'IN_PLAY' || match.status === 'LIVE') {
            const homeScore = match.score?.fullTime?.home || 0;
            const awayScore = match.score?.fullTime?.away || 0;
            scoreDisplay = `${homeScore} - ${awayScore}`;
        } else {
            scoreDisplay = 'vs';
        }

        return `
            <div class="partido-card">
                <div class="partido-header">
                    <div class="teams-container">
                        <div class="team team-home ${homeWinner}">
                            ${match.homeTeamCrest ? `<img src="${match.homeTeamCrest}" alt="${match.homeTeam}" class="team-crest" onerror="this.style.display='none'">` : ''}
                            <span class="team-name">${match.homeTeam}</span>
                        </div>

                        <div class="vs-section">
                            <div class="score">${scoreDisplay}</div>
                        </div>

                        <div class="team team-away ${awayWinner}">
                            <span class="team-name">${match.awayTeam}</span>
                            ${match.awayTeamCrest ? `<img src="${match.awayTeamCrest}" alt="${match.awayTeam}" class="team-crest" onerror="this.style.display='none'">` : ''}
                        </div>
                    </div>

                    <div class="match-info">
                        <span class="status ${statusClass}">${statusText}</span>
                        <span class="date">${formattedDate}</span>
                    </div>
                </div>

                <div class="partido-footer">
                    <button class="details-btn" data-match-id="${match.id}">
                        <i class="fas fa-info-circle"></i>
                        Ver Detalles
                    </button>

                    <div class="details-content" id="details-${match.id}">
                        <div class="detail-item">
                            <span class="detail-label">Jornada:</span>
                            <span class="detail-value">${match.matchday || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Etapa:</span>
                            <span class="detail-value">${this.translateStage(match.stage)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">ID del Partido:</span>
                            <span class="detail-value">${match.id}</span>
                        </div>
                        ${match.lastUpdated ? `
                        <div class="detail-item">
                            <span class="detail-label">Última actualización:</span>
                            <span class="detail-value">${new Date(match.lastUpdated).toLocaleString('es-ES')}</span>
                        </div>
                        ` : ''}
                        ${this.getScoreDetails(match)}
                    </div>
                </div>
            </div>
        `;
    }

    getScoreDetails(match) {
        if (!match.score) return '';

        let details = '';

        if (match.score.halfTime && (match.score.halfTime.home !== null || match.score.halfTime.away !== null)) {
            details += `
                <div class="detail-item">
                    <span class="detail-label">Medio tiempo:</span>
                    <span class="detail-value">${match.score.halfTime.home || 0} - ${match.score.halfTime.away || 0}</span>
                </div>
            `;
        }

        return details;
    }

    toggleDetails(matchId) {
        const detailsDiv = document.getElementById(`details-${matchId}`);
        const btn = document.querySelector(`button[data-match-id="${matchId}"]`);

        if (detailsDiv.classList.contains('show')) {
            detailsDiv.classList.remove('show');
            btn.innerHTML = '<i class="fas fa-info-circle"></i> Ver Detalles';
        } else {
            detailsDiv.classList.add('show');
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Detalles';
        }
    }

    translateStatus(status) {
        const translations = {
            'SCHEDULED': 'Programado',
            'LIVE': 'En Vivo',
            'IN_PLAY': 'Jugando',
            'PAUSED': 'Pausado',
            'FINISHED': 'Terminado',
            'POSTPONED': 'Pospuesto',
            'SUSPENDED': 'Suspendido',
            'CANCELLED': 'Cancelado'
        };
        return translations[status] || status;
    }

    translateStage(stage) {
        const translations = {
            'REGULAR_SEASON': 'Temporada Regular',
            'PLAYOFFS': 'Playoffs',
            'FINAL': 'Final'
        };
        return translations[stage] || stage;
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new FootballApp();
});
