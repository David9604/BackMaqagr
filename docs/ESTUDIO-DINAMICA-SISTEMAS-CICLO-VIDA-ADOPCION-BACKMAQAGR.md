# Estudio de Dinámica de Sistemas: Ciclo de Vida y Adopción de BackMaqagr

## 1. Introducción
BackMaqagr es una API REST para gestión de maquinaria agrícola, terrenos, cálculos de potencia y recomendaciones técnicas. Como producto digital B2B/B2G, su sostenibilidad depende de la adopción inicial, el uso recurrente de endpoints críticos y la retención de usuarios operativos en el tiempo. Este estudio plantea un modelo de dinámica de sistemas para analizar el ciclo de vida de adopción de BackMaqagr.

## 2. Planteamiento del Problema

### 2.1. Contexto
BackMaqagr opera en un entorno donde usuarios técnicos (productores, operadores, analistas y desarrolladores integradores) evalúan utilidad, facilidad de integración, precisión de cálculos y estabilidad del servicio. La continuidad de uso depende tanto de la calidad funcional como de la experiencia operativa.

### 2.2. Problema
El proyecto puede experimentar crecimiento inicial por necesidad operativa, pero perder tracción si no sostiene confiabilidad, documentación, soporte e iteración funcional en módulos como Auth, Tractores, Implementos, Terrenos, Cálculos y Recomendaciones.

### 2.3. Causas
- Incorporación lenta de mejoras en endpoints de alto uso.
- Fricción de integración (auth, validaciones, contratos de respuesta).
- Incidentes de disponibilidad o latencia.
- Calidad percibida insuficiente en recomendaciones y cálculos.
- Aparición de soluciones alternativas en el sector agrotech.

### 2.4. Consecuencias
- Caída de usuarios activos e integraciones recurrentes.
- Menor volumen de consultas en endpoints estratégicos.
- Incremento de usuarios en pausa o abandono del servicio.
- Reducción del valor percibido del ecosistema BackMaqagr.

### 2.5. Pregunta de Investigación
¿Cómo interactúan la captación, activación, retención, pausa y abandono de usuarios para explicar el ciclo de vida de adopción de BackMaqagr?

## 3. Justificación
Aplicar dinámica de sistemas permite representar relaciones causales entre calidad técnica, operación API, experiencia de integración y comportamiento de uso. El modelo ayuda a priorizar decisiones de producto y operación (roadmap, soporte, mejoras de desempeño y funcionalidades) con impacto medible en adopción sostenible.

## 4. Objetivos

### 4.1. Objetivo General
Diseñar un modelo de dinámica de sistemas para explicar y simular el ciclo de vida de adopción de BackMaqagr.

### 4.2. Objetivos Específicos
- Identificar variables clave del uso de la API en el contexto agrícola.
- Definir relaciones causales entre calidad de servicio, valor funcional y retención.
- Formalizar ecuaciones del modelo con stocks, flujos y variables auxiliares.
- Simular tres escenarios de desempeño de BackMaqagr.
- Evaluar sensibilidad del sistema ante factores críticos de operación y producto.

## 5. Desarrollo de la Propuesta de Dinámica de Sistemas

### 5.1. Identificación de las Variables

#### 5.1.1. Variables de Nivel (Stocks)
- **Mercado Potencial (MP):** actores del sector agrícola que podrían adoptar BackMaqagr.
- **Usuarios Interesados (UI):** organizaciones/usuarios que conocen la API y evalúan integrarla.
- **Usuarios Activos (UA):** usuarios con consumo recurrente de endpoints.
- **Usuarios en Pausa (UP):** usuarios que redujeron o detuvieron temporalmente el uso.
- **Usuarios Perdidos (UPer):** usuarios que abandonaron BackMaqagr.

#### 5.1.2. Variables de Flujo
- **Tasa de Interés (TI):** MP -> UI.
- **Tasa de Activación (TA):** UI -> UA.
- **Tasa de Pausa (TP):** UA -> UP.
- **Tasa de Reactivación (TR):** UP -> UA.
- **Tasa de Abandono Definitivo (TAD):** UP -> UPer.
- **Tasa de Desinterés (TD):** UI -> MP.

#### 5.1.3. Variables Auxiliares
- Calidad de documentación de integración.
- Disponibilidad y latencia de la API.
- Precisión de cálculos y recomendaciones.
- Frecuencia de mejoras funcionales.
- Calidad de soporte técnico.
- Atractivo de soluciones competidoras.

### 5.2. Identificación de las Variables Clasificadas
| Tipo | Variables |
|---|---|
| Endógenas | UI, UA, UP, UPer, TI, TA, TP, TR, TAD |
| Exógenas | Inversión en difusión, competencia, cambios regulatorios sector agrícola |
| Parámetros | Coeficiente de activación, sensibilidad a latencia, elasticidad al soporte |
| Indicadores | Tasa neta de adopción, retención mensual, tiempo promedio de permanencia activa |

### 5.3. Diagrama Causal
Relaciones principales:
- Mayor **calidad de documentación** aumenta **TA** (+).
- Mayor **disponibilidad API** aumenta **TA** (+) y reduce **TP** (-).
- Mayor **latencia/incidentes** aumenta **TP** (+) y **TAD** (+).
- Mayor **precisión en recomendaciones** aumenta **UA** y **TR** (+).
- Mayor **competencia** reduce **TA** (-) y aumenta **TD** (+).
- Mayor **UA** incrementa **referencia entre usuarios del sector**, elevando **TI** (+).

### 5.3.1. Interpretación de las Relaciones Causales
La adopción de BackMaqagr se fortalece cuando la utilidad técnica y la experiencia de integración son consistentes. Si el servicio se degrada o no evoluciona, aumentan pausa y abandono, afectando el crecimiento orgánico.

### 5.3.2. Bucles de Retroalimentación
- **R1 (Refuerzo por valor percibido):** UA -> casos de éxito -> TI -> UI -> TA -> UA.
- **B1 (Balance por fricción operativa):** UA -> incidentes/fricción -> TP -> UP -> TAD -> UPer.
- **R2 (Refuerzo por mejora continua):** mejoras funcionales -> TR -> UA -> feedback útil -> nuevas mejoras.

### 5.4. Diagrama de Influencias
Las palancas de mayor influencia son: estabilidad técnica, precisión funcional y experiencia de integración. La competencia y eventos externos del sector influyen como fuerzas de salida o desaceleración de crecimiento.

### 5.5. Diagrama de Forrester
Estructura de niveles y flujos:
- MP alimenta UI por TI.
- UI alimenta UA por TA y retorna a MP por TD.
- UA migra a UP por TP.
- UP retorna a UA por TR o migra a UPer por TAD.

### 5.5.1. Ecuaciones del Modelo
En forma discreta (paso mensual):

- MP(t+1) = MP(t) - TI(t) + TD(t)
- UI(t+1) = UI(t) + TI(t) - TA(t) - TD(t)
- UA(t+1) = UA(t) + TA(t) + TR(t) - TP(t)
- UP(t+1) = UP(t) + TP(t) - TR(t) - TAD(t)
- UPer(t+1) = UPer(t) + TAD(t)

Flujos:
- TI = MP * (a1*Difusión + a2*ReferenciaSector)
- TA = UI * (b1*CalidadDocumentacion + b2*Disponibilidad + b3*ValorFuncional - b4*Competencia)
- TP = UA * (c1*Latencia + c2*Incidentes + c3*FaltaMejoras)
- TR = UP * (d1*Mejoras + d2*Soporte)
- TAD = UP * (e1*TiempoEnPausa + e2*Competencia + e3*BajoValorPercibido)
- TD = UI * f1 * (Competencia)

## 6. Configuración del Tiempo del Modelo
- Horizonte de simulación: 36 meses.
- Paso temporal: 1 mes.
- Condiciones iniciales sugeridas:
  - MP = 10.000 organizaciones/usuarios objetivo.
  - UI = 500.
  - UA = 120.
  - UP = 30.
  - UPer = 0.

## 7. Escenarios de Simulación

### 7.1. Escenario Base (Adopción Baja)
- Disponibilidad y desempeño inestables.
- Mejoras funcionales poco frecuentes.
- Documentación con brechas para integración.
- Competencia moderada-alta.

Resultado esperado: crecimiento corto y posterior caída de UA, con incremento sostenido de UPer.

### 7.2. Escenario Intermedio (Uso de Nicho Estable)
- Estabilidad técnica aceptable.
- Mejoras periódicas en endpoints críticos.
- Soporte reactivo con tiempos razonables.
- Segmento de usuarios fieles.

Resultado esperado: UA se mantiene en una meseta operativa, con abandono controlado.

### 7.3. Escenario Óptimo (Adopción Ampliada)
- Alta disponibilidad y baja latencia.
- Documentación clara y onboarding efectivo.
- Mejoras continuas en cálculos y recomendaciones.
- Soporte proactivo y ciclo de feedback rápido.

Resultado esperado: crecimiento sostenido de UA, mayor TR y bajo TAD.

## 8. Gráficos de Simulación de los 3 Escenarios
Se recomienda graficar series mensuales (1 a 36) para:

### 8.1. Mercado Potencial
Muestra el universo restante por captar; disminuye más rápido en el escenario óptimo por mayor conversión real.

### 8.2. Usuarios Interesados
En escenario base se observa pico temprano y caída; en intermedio oscila; en óptimo mantiene entradas recurrentes.

### 8.3. Usuarios Activos
Indicador central del éxito operativo:
- Base: declive.
- Intermedio: estabilidad.
- Óptimo: crecimiento y consolidación.

### 8.4. Usuarios en Pausa
Permite detectar fricción operativa:
- Base: incremento acelerado.
- Intermedio: nivel medio controlado.
- Óptimo: volumen bajo por reactivación alta.

### 8.5. Usuarios Perdidos
Mide deterioro estructural de adopción:
- Base: crecimiento rápido.
- Intermedio: crecimiento lento.
- Óptimo: crecimiento bajo y tardío.

## 9. Análisis de Sensibilización de los Escenarios

### 9.1. Impacto de la Falta de Evolución Funcional
En BackMaqagr, se interpreta como baja evolución funcional (nuevos casos de uso, ajustes de precisión, mejoras de endpoints). Aumenta TP y TAD de forma significativa.

### 9.2. Impacto de Lanzamientos y Mejoras Funcionales
Para el proyecto equivale a releases funcionales, mejoras de documentación, nuevas capacidades de cálculo y optimizaciones. Incrementa TR y fortalece retención.

### 9.3. Impacto del Atractivo de Competencia
Si alternativas ofrecen integración más simple o mejor rendimiento, TA cae y TD sube, reduciendo adopción neta.

### 9.4. Sensibilidad Combinada
La combinación de alta fricción técnica + competencia fuerte produce el peor resultado. En cambio, estabilidad técnica + mejora continua + soporte efectivo genera resiliencia del sistema.

## 10. Conclusión
La adopción de BackMaqagr no depende solo de una salida inicial funcional, sino de su capacidad para sostener valor operativo en el tiempo. El modelo de dinámica de sistemas muestra que disponibilidad, calidad técnica, evolución funcional y soporte son determinantes para retener usuarios activos y minimizar abandono. Los escenarios y sensibilidades permiten priorizar decisiones de producto con impacto directo en sostenibilidad del proyecto.
