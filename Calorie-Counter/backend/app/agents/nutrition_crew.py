"""Stage 5 — CrewAI crew for nutrition analysis (optional).

Scaffold only: safe to import without crewai installed. The crew would split
plate analysis into roles (vision specialist, FAO researcher, nutritionist)
and produce a combined report with agentic reasoning on top of the core
pipeline in ``app.services``.
"""

from __future__ import annotations

from typing import Any


class NutritionCrew:
    """Coordinate agents for identifying dishes and building a nutrition report."""

    def __init__(self) -> None:
        self._crew = None

    def build(self) -> Any:
        """Create the crew. Requires crewai installed."""
        try:
            from crewai import Agent, Crew, Task  # lazy import
        except ImportError as exc:  # pragma: no cover - dependency optional
            raise ImportError(
                "crewai is not installed. Add it to requirements.txt to use Stage 5."
            ) from exc

        researcher = Agent(
            role="FAO/WAFCT Researcher",
            goal="Resolve each identified dish against the FAO/WAFCT database.",
            backstory="Expert in West African food composition tables.",
        )
        nutritionist = Agent(
            role="Nutritionist",
            goal="Aggregate per-dish nutrients into one clear plate report.",
            backstory="Specialist in Nigerian meal portion estimation.",
        )
        identify_task = Task(
            description="Identify every distinct dish visible in the plate photo.",
            expected_output="A JSON list of dishes with dishKey, displayName, estimatedGrams.",
            agent=researcher,
        )
        aggregate_task = Task(
            description="Combine per-dish nutrient values into a plate total.",
            expected_output="A scannedFoodData-shaped JSON report.",
            agent=nutritionist,
        )
        self._crew = Crew(
            agents=[researcher, nutritionist],
            tasks=[identify_task, aggregate_task],
            verbose=True,
        )
        return self._crew

    async def run(self, image_bytes: bytes, mime_type: str) -> Any:
        crew = self.build()
        return await crew.kickoff_async(
            inputs={"image_bytes": image_bytes, "mime_type": mime_type}
        )