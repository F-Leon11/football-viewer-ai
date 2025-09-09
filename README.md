# ⚽ Visualizador de Partidos de Fútbol con Inteligencia Artificial

Una aplicación web moderna que permite consultar partidos de fútbol de la **Premier League** utilizando inteligencia artificial para filtrar y buscar información de manera natural.

## 🔧 Tecnologías Utilizadas

- **Backend**: Python + Flask
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **APIs**:
  - Football Data API (datos deportivos en tiempo real)
  - Gemini AI (procesamiento de lenguaje natural)
- **Estilo**: CSS moderno con gradientes y animaciones

## 🎯 Funcionalidades

### 📊 Visualización de Partidos
- **Equipos participantes** con escudos (cuando están disponibles)
- **Fecha y hora** de cada partido
- **Estado del partido**: Programado, En vivo, Terminado, Pospuesto, etc.
- **Marcador final** para partidos terminados
- **Indicador visual** del equipo ganador (👑)

### 🤖 Búsqueda Inteligente con IA
Usa **Gemini AI** para interpretar consultas en lenguaje natural:

**Ejemplos de búsquedas:**
- `"partidos del Arsenal"`
- `"partidos terminados"`
- `"Manchester United partidos ya jugados"`
- `"partidos más importantes"`
- `"Chelsea vs Liverpool"`

### 📱 Detalles Expandibles
- **Jornada** del partido
- **Etapa** de la competición
- **Marcador del medio tiempo**
- **Última actualización**
- **ID único** del partido

### 🎨 Diseño Responsivo
- **Mobile-first** design
- **Animaciones** suaves
- **Estados de carga** interactivos
- **Manejo de errores** elegante

## 🚀 Instalación y Uso

### Prerrequisitos
- Python 3.8+
- Pip instalado

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd football-viewer-ai
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar APIs
Las claves de API ya están configuradas en el código:
- **Football Data API**: Para obtener datos de partidos
- **Gemini AI**: Para procesamiento inteligente de búsquedas

### 4. Ejecutar la aplicación
```bash
python3 app.py
```

La aplicación estará disponible en: `http://localhost:5000`

## 📋 Estructura del Proyecto

```
football-viewer-ai/
├── app.py                 # Aplicación principal Flask
├── requirements.txt       # Dependencias Python
├── templates/
│   └── index.html        # Template principal
├── static/
│   ├── style.css         # Estilos CSS
│   └── script.js         # Lógica JavaScript
└── .same/
    └── todos.md          # Documentación de desarrollo
```

## 🔌 Endpoints de la API

### `GET /`
Página principal de la aplicación

### `GET /partidos`
Obtiene todos los partidos de la Premier League
```json
{
  "partidos": [
    {
      "id": 12345,
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea",
      "status": "FINISHED",
      "score": {"fullTime": {"home": 2, "away": 1}},
      "utcDate": "2024-01-15T15:00:00Z"
    }
  ]
}
```

### `POST /buscar`
Búsqueda inteligente con IA
```json
{
  "query": "partidos del Arsenal terminados"
}
```

**Respuesta:**
```json
{
  "partidos": [...],
  "filter_applied": {"team": "Arsenal", "status": "FINISHED"},
  "total_found": 5
}
```

## 🧠 Cómo Funciona la IA

1. **Usuario escribe consulta** en lenguaje natural
2. **Gemini AI analiza** la consulta y extrae filtros
3. **Backend aplica filtros** a los datos de la API
4. **Frontend muestra resultados** filtrados

### Filtros Soportados por la IA:
- **Por equipo**: Busca partidos donde juegue un equipo específico
- **Por estado**: Filtra por estado del partido (terminado, programado, etc.)
- **Combinados**: Puede combinar múltiples filtros

## 🎨 Características del Diseño

- **Gradientes modernos** en la interfaz
- **Cards interactivas** con hover effects
- **Iconos Font Awesome** para mejor UX
- **Estados visuales** claros (ganador, en vivo, etc.)
- **Responsive design** para móviles y desktop

## 🔧 Personalización

### Cambiar Liga de Fútbol
Modifica en `app.py`:
```python
# Cambiar ID de competición (2021 = Premier League)
url = f"{BASE_URL}/competitions/2021/matches"
```

### Agregar Nuevos Filtros
Extiende el prompt de Gemini AI en el endpoint `/buscar` para soportar nuevos tipos de filtros.

## 📈 Próximas Mejoras

- [ ] Soporte para múltiples ligas
- [ ] Histórico de partidos por temporada
- [ ] Estadísticas detalladas de equipos
- [ ] Notificaciones en tiempo real
- [ ] Modo oscuro/claro



**Desarrollado con ❤️ y ⚽ por el equipo de desarrollo**
