from flask import Flask, render_template, jsonify, request
import requests
import google.generativeai as genai
import os
from datetime import datetime
import json

app = Flask(__name__)

# Configuración de APIs
FOOTBALL_API_KEY = "589b99f577194861b5c1cf6940138099"
GEMINI_API_KEY = "AIzaSyCBgdHgpEuRTWc-7SIFqGSjBC1FqGdteOE"
BASE_URL = "https://api.football-data.org/v4"

# Configurar Gemini AI
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/partidos')
def get_partidos():
    """Obtener partidos de la Premier League"""
    try:
        headers = {
            'X-Auth-Token': FOOTBALL_API_KEY
        }

        # Premier League ID = 2021
        url = f"{BASE_URL}/competitions/2021/matches"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            partidos = []

            for match in data.get('matches', []):
                partido = {
                    'id': match['id'],
                    'homeTeam': match['homeTeam']['name'],
                    'awayTeam': match['awayTeam']['name'],
                    'homeTeamCrest': match['homeTeam'].get('crest', ''),
                    'awayTeamCrest': match['awayTeam'].get('crest', ''),
                    'status': match['status'],
                    'utcDate': match['utcDate'],
                    'score': match.get('score', {}),
                    'matchday': match.get('matchday', 0),
                    'stage': match.get('stage', 'REGULAR_SEASON'),
                    'lastUpdated': match.get('lastUpdated', '')
                }
                partidos.append(partido)

            return jsonify({'partidos': partidos})
        else:
            return jsonify({'error': 'Error al obtener partidos'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/buscar', methods=['POST'])
def buscar_con_ia():
    """Buscar partidos usando IA de Gemini"""
    try:
        data = request.get_json()
        query = data.get('query', '')

        headers = {
            'X-Auth-Token': FOOTBALL_API_KEY
        }

        # Mapeo de equipos famosos a sus ligas
        league_mapping = {
            'real madrid': 2014,  # La Liga
            'barcelona': 2014,
            'atletico madrid': 2014,
            'sevilla': 2014,
            'valencia': 2014,
            'villarreal': 2014,
            'real sociedad': 2014,
            'juventus': 2019,  # Serie A
            'milan': 2019,
            'inter': 2019,
            'napoli': 2019,
            'roma': 2019,
            'lazio': 2019,
            'bayern munich': 2002,  # Bundesliga
            'borussia dortmund': 2002,
            'bayern': 2002,
            'dortmund': 2002,
            'leipzig': 2002,
            'psg': 2015,  # Ligue 1
            'paris saint-germain': 2015,
            'marseille': 2015,
            'lyon': 2015
        }

        # Determinar qué liga buscar basándose en la consulta
        competition_id = 2021  # Premier League por defecto
        competition_name = "Premier League"
        query_lower = query.lower()

        for team, league_id in league_mapping.items():
            if team in query_lower:
                competition_id = league_id
                if league_id == 2014:
                    competition_name = "La Liga"
                elif league_id == 2019:
                    competition_name = "Serie A"
                elif league_id == 2002:
                    competition_name = "Bundesliga"
                elif league_id == 2015:
                    competition_name = "Ligue 1"
                break

        url = f"{BASE_URL}/competitions/{competition_id}/matches"
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            return jsonify({'error': 'Error al obtener partidos'}), 500

        matches_data = response.json()
        partidos = []

        for match in matches_data.get('matches', []):
            partido = {
                'id': match['id'],
                'homeTeam': match['homeTeam']['name'],
                'awayTeam': match['awayTeam']['name'],
                'homeTeamCrest': match['homeTeam'].get('crest', ''),
                'awayTeamCrest': match['awayTeam'].get('crest', ''),
                'status': match['status'],
                'utcDate': match['utcDate'],
                'score': match.get('score', {}),
                'matchday': match.get('matchday', 0),
                'stage': match.get('stage', 'REGULAR_SEASON'),
                'lastUpdated': match.get('lastUpdated', ''),
                'competition': competition_name
            }
            partidos.append(partido)

        # Crear prompt para Gemini
        teams_list = list(set([p['homeTeam'] for p in partidos] + [p['awayTeam'] for p in partidos]))

        prompt = f"""
        El usuario quiere filtrar partidos de fútbol con esta consulta: "{query}"

        Equipos disponibles en {competition_name}: {', '.join(teams_list)}
        Estados posibles: SCHEDULED (programado), LIVE (en vivo), IN_PLAY (jugando), PAUSED (pausado), FINISHED (terminado), POSTPONED (pospuesto), SUSPENDED (suspendido), CANCELLED (cancelado)

        Basándote en la consulta del usuario, responde ÚNICAMENTE con un objeto JSON con las siguientes claves posibles:
        - "team": nombre exacto del equipo si se menciona uno específico
        - "status": uno de los estados mencionados arriba si se solicita filtrar por estado
        - "action": "show_all" si no hay filtros específicos

        Ejemplos:
        - "partidos del Arsenal" -> {{"team": "Arsenal"}}
        - "partidos terminados" -> {{"status": "FINISHED"}}
        - "partidos de Manchester United ya jugados" -> {{"team": "Manchester United", "status": "FINISHED"}}
        - "todos los partidos" -> {{"action": "show_all"}}

        Responde SOLO el JSON, sin explicaciones adicionales.
        """

        # Llamar a Gemini
        response = model.generate_content(prompt)
        ai_response = response.text.strip()

        try:
            # Parsear respuesta de la IA
            filter_params = json.loads(ai_response)
        except:
            # Si falla el parsing, mostrar todos los partidos
            filter_params = {"action": "show_all"}

        # Aplicar filtros
        partidos_filtrados = partidos.copy()

        if 'team' in filter_params:
            team_name = filter_params['team']
            partidos_filtrados = [
                p for p in partidos_filtrados
                if team_name.lower() in p['homeTeam'].lower() or team_name.lower() in p['awayTeam'].lower()
            ]

        if 'status' in filter_params:
            status = filter_params['status']
            partidos_filtrados = [
                p for p in partidos_filtrados
                if p['status'] == status
            ]

        return jsonify({
            'partidos': partidos_filtrados,
            'filter_applied': filter_params,
            'total_found': len(partidos_filtrados),
            'competition': competition_name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
