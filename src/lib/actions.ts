"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/store";
import { parseRequestForm } from "@/lib/engineering-agent/schema";
import { DEFAULT_MODEL_ID, getModel } from "@/lib/engineering-agent/mock-model";

export interface CreateWorkflowState {
  errors?: Record<string, string>;
  values?: Record<string, string>;
}

/**
 * Create a request and run the full agent pipeline. Validation happens here —
 * Server Actions are public endpoints, so the Zod schema is the trust boundary.
 */
export async function createWorkflowAction(
  _prev: CreateWorkflowState,
  formData: FormData,
): Promise<CreateWorkflowState> {
  const parsed = parseRequestForm(formData);
  if (!parsed.ok) {
    return {
      errors: parsed.errors,
      values: {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        framework: String(formData.get("framework") ?? ""),
        complexity: String(formData.get("complexity") ?? ""),
        riskLevel: String(formData.get("riskLevel") ?? ""),
        acceptanceCriteria: String(formData.get("acceptanceCriteria") ?? ""),
      },
    };
  }

  const requestedModel = String(formData.get("modelId") ?? DEFAULT_MODEL_ID);
  // Only `ready` models can run without credentials; fall back to the simulator.
  const model = getModel(requestedModel);
  const modelId = model.ready ? model.id : DEFAULT_MODEL_ID;

  const repo = await getRepository();
  const workflowId = await repo.createAndRunWorkflow(parsed.data, modelId);

  revalidatePath("/workflows");
  revalidatePath("/dashboard");
  redirect(`/workflows/${workflowId}`);
}

export async function approveWorkflowAction(formData: FormData): Promise<void> {
  const workflowId = String(formData.get("workflowId") ?? "");
  const approved = String(formData.get("decision")) === "approve";
  const note = String(formData.get("note") ?? "").trim();

  const repo = await getRepository();
  await repo.approveWorkflow(workflowId, { approved, note });

  revalidatePath(`/workflows/${workflowId}`);
  revalidatePath("/workflows");
  revalidatePath("/dashboard");
  revalidatePath("/artifacts");
}

export async function retryWorkflowAction(formData: FormData): Promise<void> {
  const workflowId = String(formData.get("workflowId") ?? "");
  const repo = await getRepository();
  const newId = await repo.retryWorkflow(workflowId);
  revalidatePath("/workflows");
  revalidatePath("/dashboard");
  redirect(`/workflows/${newId}`);
}
