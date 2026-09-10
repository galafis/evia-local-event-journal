-- No free text or participant identity / Sem texto livre ou identidade de participante.
SELECT e.scenario_id, e.source, e.cutoff_ms, e.now_ms, e.excluded_count,
       COUNT(v.sequence) AS retained_count,
       COUNT(DISTINCT v.session_id) AS session_codes
FROM exports AS e LEFT JOIN events AS v ON e.scenario_id = v.scenario_id
GROUP BY e.scenario_id
ORDER BY e.scenario_id;
