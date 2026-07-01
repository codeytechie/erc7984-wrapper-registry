import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { txUrl } from "./networks";
import { shortAddr } from "./format";

// success toast with a clickable link to the tx on the explorer
export function txToast(chainId: number, title: string, hash: string): void {
  toast.success(title, {
    description: (
      <a
        href={txUrl(chainId, hash)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 underline underline-offset-2"
      >
        {shortAddr(hash)}
        <ExternalLink className="size-3" />
      </a>
    ),
  });
}
