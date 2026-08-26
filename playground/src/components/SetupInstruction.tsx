import type { SetupStep } from "@finon/connect";

export function SetupInstruction({ step }: { step: SetupStep }) {
	if (!step.link || !step.description.includes("{{link}}")) return <li>{step.description}</li>;
	const [before, after] = step.description.split("{{link}}");
	return (
		<li>
			{before}
			<a href={step.link.webUrl} target="_blank" rel="noreferrer">
				{step.link.text}
			</a>
			{after}
		</li>
	);
}
