"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";

interface OrganizationResponse {
  id: string;
  name: string;
  domain: string;
}

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<OrganizationResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const org = await apiFetch<OrganizationResponse>("/api/v1/organizations", {
        method: "POST",
        body: JSON.stringify({ name, domain }),
      });
      setCreated(org);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900">Organization registered</h1>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">{created.name}</p>
          <p className="mt-1">
            Domain: <span className="font-mono">{created.domain}</span>
          </p>
        </div>
        <p className="text-sm text-zinc-600">
          You can now create an account. The first employee to sign up under{" "}
          <span className="font-mono">{created.domain}</span> becomes the organization
          admin.
        </p>
        <Link
          href={`/signup?domain=${encodeURIComponent(created.domain)}`}
          className="rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700"
        >
          Create the first account
        </Link>
        <button
          onClick={() => {
            setCreated(null);
            setName("");
            setDomain("");
          }}
          className="text-sm font-medium text-zinc-600 underline"
        >
          Register another organization
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900">Register your organization</h1>
      <p className="text-sm text-zinc-600">
        Onboard your company to CommuteShare. Once registered, employees whose work email
        uses your domain can sign up and start sharing rides.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Organization name
          <input
            required
            placeholder="e.g. Nirma University"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Email domain
          <input
            required
            placeholder="e.g. nirmauni.ac.in (no @ symbol)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
          <span className="text-xs font-normal text-zinc-500">
            The part after the @ in employee work emails. Only people with an email on
            this domain will be able to join.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Registering..." : "Register organization"}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        Already registered?{" "}
        <Link href="/signup" className="font-medium text-zinc-900 underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
