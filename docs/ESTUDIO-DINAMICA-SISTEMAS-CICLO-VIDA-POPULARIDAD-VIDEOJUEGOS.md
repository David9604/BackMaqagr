# Estudio de Dinámica de Sistemas: Ciclo de Vida y Popularidad de Videojuegos

## 1. Introducción
La industria de los videojuegos presenta ciclos de adopción rápidos, picos de popularidad intensos y fases de declive que dependen de la calidad inicial, la retención, la competencia y la capacidad del estudio para mantener contenido relevante. Este estudio propone un modelo de dinámica de sistemas para entender cómo evoluciona la base de jugadores a lo largo del tiempo y qué decisiones pueden cambiar el resultado comercial de un lanzamiento.

## 2. Planteamiento del Problema

### 2.1. Contexto
Un videojuego moderno compite en un mercado saturado, donde la atención del usuario es limitada y los costos de adquisición de jugadores son crecientes. El éxito no depende únicamente del lanzamiento, sino de la capacidad de sostener el interés mediante mejoras, eventos y contenido adicional.

### 2.2. Problema
Muchos proyectos de videojuegos no logran sostener su base de jugadores después del lanzamiento, generando caídas de actividad, baja rentabilidad y cierre prematuro del servicio.

### 2.3. Causas
- Estrategias de marketing desalineadas con el público objetivo.
- Falta de contenido post-lanzamiento.
- Errores técnicos y mala experiencia de usuario.
- Alta presión competitiva de otros títulos.
- Respuesta lenta a retroalimentación de la comunidad.

### 2.4. Consecuencias
- Reducción acelerada de jugadores activos.
- Disminución de ingresos recurrentes.
- Deterioro de reputación de marca.
- Menor probabilidad de expansión o secuelas.

### 2.5. Pregunta de Investigación
¿Cómo interactúan la adquisición, retención, reactivación y abandono de jugadores para determinar el ciclo de vida y el nivel de popularidad de un videojuego?

## 3. Justificación
El enfoque de dinámica de sistemas permite modelar relaciones no lineales y bucles de retroalimentación entre variables de mercado, producto y comportamiento del usuario. Este enfoque aporta una base cuantitativa para diseñar estrategias de lanzamiento, contenido y operación en vivo (live ops), reduciendo incertidumbre y mejorando la toma de decisiones.

## 4. Objetivos

### 4.1. Objetivo General
Construir un modelo de dinámica de sistemas que represente el ciclo de vida de popularidad de un videojuego y permita evaluar escenarios de desempeño.

### 4.2. Objetivos Específicos
- Identificar variables clave de adopción, retención y abandono.
- Definir relaciones causales y bucles de retroalimentación.
- Formular ecuaciones del modelo en términos de stocks y flujos.
- Simular escenarios de fracaso, estabilidad y éxito masivo.
- Analizar sensibilidad del sistema ante factores críticos.

## 5. Desarrollo de la Propuesta de Dinámica de Sistemas

### 5.1. Identificación de las Variables

### 5.1.1. Variables de Nivel (Stocks)
- **Mercado Potencial (MP):** personas que podrían jugar.
- **Jugadores Interesados (JI):** usuarios que conocen el juego y evalúan entrar.
- **Jugadores Activos (JA):** usuarios que juegan regularmente.
- **Jugadores en Pausa (JP):** usuarios que dejaron de jugar temporalmente.
- **Jugadores Perdidos (JPe):** usuarios que abandonaron de forma estable.

### 5.1.2. Variables de Flujo
- **Tasa de Interés (TI):** MP -> JI.
- **Tasa de Conversión (TC):** JI -> JA.
- **Tasa de Pausa (TP):** JA -> JP.
- **Tasa de Reactivación (TR):** JP -> JA.
- **Tasa de Abandono Definitivo (TAD):** JP -> JPe.
- **Tasa de Desinterés (TD):** JI -> MP.

### 5.1.3. Variables Auxiliares
- Calidad percibida del lanzamiento.
- Intensidad de marketing.
- Impacto de eventos y DLCs.
- Factor de falta de contenido.
- Atractivo de la competencia.
- Efecto boca a boca.

### 5.2. Identificación de las Variables Clasificadas
| Tipo | Variables |
|---|---|
| Endógenas | JI, JA, JP, JPe, TI, TC, TP, TR, TAD |
| Exógenas | Intensidad de marketing, atractivo de competencia, presupuesto, calendario de DLC |
| Parámetros | Coeficiente de retención, elasticidad al contenido, eficacia de campañas |
| Indicadores | Popularidad total, tasa neta de crecimiento, vida media de jugadores activos |

### 5.3. Diagrama Causal
Relaciones principales:
- Mayor **marketing** aumenta **TI** (+).
- Mayor **calidad percibida** aumenta **TC** (+) y reduce **TP** (-).
- Mayor **falta de contenido** aumenta **TP** (+) y **TAD** (+).
- Mayor **impacto de eventos/DLCs** aumenta **TR** (+) y reduce **TAD** (-).
- Mayor **competencia** reduce **TC** (-) y aumenta **TP** (+).
- Mayor **JA** incrementa **boca a boca**, elevando **TI** (+).

### 5.3.1. Interpretación de las Relaciones Causales
El sistema combina crecimiento por difusión social y contracción por fatiga/competencia. Si el contenido evoluciona con ritmo adecuado, la reactivación compensa la pérdida. Si no, el abandono supera la entrada y la popularidad cae.

### 5.3.2. Bucles de Retroalimentación
- **R1 (Refuerzo de popularidad):** JA -> boca a boca -> TI -> JI -> TC -> JA.
- **B1 (Balance por desgaste):** JA -> fatiga/falta de contenido -> TP -> JP -> TAD -> JPe.
- **R2 (Refuerzo por live ops):** eventos/DLC -> TR -> JA -> mayor comunidad -> más participación en eventos.

### 5.4. Diagrama de Influencias
Nodos dominantes: calidad de lanzamiento, marketing, contenido continuo, competencia y respuesta de comunidad.  
Influencia estructural: **calidad + contenido** actúan como palancas de retención; **marketing** acelera entrada inicial; **competencia** acelera salida.

### 5.5. Diagrama de Forrester
Estructura de niveles y flujos:
- MP alimenta JI por TI.
- JI alimenta JA por TC y retorna a MP por TD.
- JA migra a JP por TP.
- JP retorna a JA por TR o sale a JPe por TAD.

### 5.5.1. Ecuaciones del Modelo
En forma discreta (paso mensual):

- MP(t+1) = MP(t) - TI(t) + TD(t)
- JI(t+1) = JI(t) + TI(t) - TC(t) - TD(t)
- JA(t+1) = JA(t) + TC(t) + TR(t) - TP(t)
- JP(t+1) = JP(t) + TP(t) - TR(t) - TAD(t)
- JPe(t+1) = JPe(t) + TAD(t)

Flujos:
- TI = MP * (a1*Marketing + a2*BocaABoca)
- TC = JI * (b1*Calidad - b2*Competencia)
- TP = JA * (c1*FaltaContenido + c2*Competencia - c3*Eventos)
- TR = JP * (d1*Eventos + d2*Mejoras)
- TAD = JP * (e1*FaltaContenido + e2*TiempoEnPausa)
- TD = JI * f1*(Competencia)

## 6. Configuración del Tiempo del Modelo
- Horizonte: 36 meses.
- Paso de simulación: 1 mes.
- Condiciones iniciales sugeridas:
  - MP = 1,000,000
  - JI = 30,000
  - JA = 10,000
  - JP = 2,000
  - JPe = 0

## 7. Escenarios de Simulación

### 7.1. Escenario Base (Fracaso del Lanzamiento)
- Baja calidad inicial.
- Marketing alto solo en pre-lanzamiento.
- Sin roadmap sólido de contenido.
- Competencia alta.

Resultado esperado: pico corto y caída rápida de JA, aumento acelerado de JPe.

### 7.2. Escenario Intermedio (Juego de Nicho Estable)
- Calidad aceptable.
- Marketing segmentado moderado.
- Eventos periódicos limitados.
- Comunidad pequeña pero fiel.

Resultado esperado: JA se estabiliza en meseta media, con pérdidas controladas.

### 7.3. Escenario Óptimo (Éxito Masivo / Juego del Año)
- Alta calidad de lanzamiento.
- Marketing sostenido por etapas.
- Calendario fuerte de eventos y DLCs.
- Respuesta rápida a feedback.

Resultado esperado: crecimiento prolongado de JA, menor TAD y expansión de comunidad.

## 8. Gráficos de Simulación de los 3 Escenarios
Los gráficos deben representar series temporales (mes 1 a 36) para cada variable:

### 8.1. Mercado Potencial
Disminuye más rápido en el escenario óptimo por mayor conversión y más lento en el escenario base por baja tracción real.

### 8.2. Jugadores Interesados
En base: pico temprano y colapso.  
En intermedio: oscilación moderada.  
En óptimo: picos sucesivos por campañas y eventos.

### 8.3. Jugadores Activos
Variable crítica de éxito:
- Base: caída sostenida.
- Intermedio: estabilización.
- Óptimo: crecimiento y meseta alta.

### 8.4. Jugadores en Pausa
- Base: crece rápido y luego deriva a perdidos.
- Intermedio: volumen medio estable.
- Óptimo: controlado por alta reactivación.

### 8.5. Jugadores Perdidos
- Base: crecimiento acelerado.
- Intermedio: crecimiento lento.
- Óptimo: crecimiento bajo y tardío.

## 9. Análisis de Sensibilización de los Escenarios

### 9.1. Impacto del Factor de Falta de Contenido
Incrementos pequeños en falta de contenido elevan TP y TAD de forma desproporcionada, acortando la vida útil del juego.

### 9.2. Impacto del Impacto de Eventos y DLCs
Mayor frecuencia y calidad de eventos incrementa TR y reduce TAD, especialmente en escenarios con comunidad ya establecida.

### 9.3. Impacto del Atractivo de Competencia
Competencia alta reduce TC y aumenta TP; el efecto es más severo en juegos con propuesta de valor poco diferenciada.

### 9.4. Sensibilidad Combinada
La combinación de alta competencia + falta de contenido es el patrón más destructivo. En contraste, alta calidad + live ops sostenido crea resiliencia ante shocks de mercado.

## 10. Conclusión
El ciclo de vida de un videojuego puede explicarse mediante la interacción entre adquisición, retención, pausa, reactivación y abandono. El modelo propuesto muestra que el éxito sostenible no depende solo del lanzamiento, sino del equilibrio dinámico entre calidad, contenido continuo y capacidad de respuesta competitiva. La simulación por escenarios permite priorizar decisiones estratégicas y reducir riesgo de fracaso comercial.
