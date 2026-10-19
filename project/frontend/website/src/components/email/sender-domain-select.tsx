import { Select } from "../ui";

export const SENDER_DOMAINS = [
    {
        value: 'gmaill.co.za',
        label: '@gmaill.co.za'
    },
    {
        value: 'example-compnay.xyz',
        label: '@example-compnay.xyz'
    },
];

interface SenderDomainSelectProps{
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
}

export function SenderDomainSelect({
    value,
    onChange,
    error,
    disabled = false,
}: SenderDomainSelectProps) {
    return (
        <Select
            label="Sender domain"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            options={SENDER_DOMAINS}
            error={error}
            disabled={disabled}
            required
        />
    )
}