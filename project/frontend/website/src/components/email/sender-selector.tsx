import { useMemo, useState, type CSSProperties } from "react";
import { Input } from "../ui";
import type { SenderOptions } from "../../services/send-batch-email";
import type { User } from "../../services/user";


export type SenderMode = "automatic" | "custom" | "company";

export interface SenderSelection{
  mode: SenderMode;
  customName: string;
  senderAuth0Id: string;
  alias: string;
}

interface SenderSelectorProps {
  users: User[];
  userLoading?: boolean;
  value: SenderSelection;
  onChange: (value: SenderSelection) => void;
  domain?: string;
}

export const initialSenderSelection: SenderSelection = {
  mode: "automatic",
  customName:'',
  senderAuth0Id: '',
  alias: ''
};

export function getSenderOptions(selection: SenderSelection): SenderOptions {
  const alias = selection.alias.trim() || undefined;

  if (selection.mode === 'custom'){
    return {
      senderCustomName: selection.customName.trim() || undefined,
      alias,
    }
  }

  if (selection.mode === 'company'){
    return {
      senderAuth0Id: selection.senderAuth0Id || undefined,
      alias,
    }
  }

  return {
    alias,
  }
}

export function SenderSelector({
  users,
  userLoading = false,
  value,
  onChange,
  domain
}: SenderSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const cleanedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!user.isActive) {
        return false;
      }

      if (!cleanedSearch) {
        return true;
      }

      return (
        user.name.toLowerCase().includes(cleanedSearch) || user.email.toLowerCase().includes(cleanedSearch)
      )
    });
  }, [users, search]);

  const selectedUser = users.find((user) => user.auth0Id === value.senderAuth0Id);

  const setMode = (mode: SenderMode) => {
    onChange({
      ...value,
      mode,
      customName: mode === 'custom' ? value.customName : '',
      senderAuth0Id: mode === 'company' ? value.senderAuth0Id : '',
    })
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const supportingTextStyle: CSSProperties = {
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const optionStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    border: '1px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection:'column',
        gap: 16,
      }}
    >
      <div>
        <label style={labelStyle}>Sender</label>
        <p style={supportingTextStyle}>
          Choose how the sender name should be selected when the email is sent.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        <label style={optionStyle}>
          <input
            type="radio"
            name="sender-mode"
            checked={value.mode === "automatic"}
            onChange={() => setMode("automatic")}
          />

          <span>
            <span style={labelStyle}>Automatic sender</span>
            <span style={supportingTextStyle}>
              Choose an eligible company user automatically.
            </span>
          </span>
        </label>

        <label style={optionStyle}>
          <input
            type="radio"
            name="sender-mode"
            checked={value.mode === "custom"}
            onChange={() => setMode("custom")}
          />

          <span>
            <span style={labelStyle}>Custom sender</span>
            <span style={supportingTextStyle}>
              Enter a custom name for the sender address.
            </span>
          </span>
        </label>

        <label style={optionStyle}>
          <input
            type="radio"
            name="sender-mode"
            checked={value.mode === "company"}
            onChange={() => setMode("company")}
          />

          <span>
            <span style={labelStyle}>Spoof company user</span>
            <span style={supportingTextStyle}>
              Select an existing company user to use as the sender.
            </span>
          </span>
        </label>
      </div>

      {value.mode === "custom" && (
        <div>
          <Input
            label="Sender name"
            placeholder="e.g. security"
            value={value.customName}
            onChange={(event) =>
              onChange({
                ...value,
                customName: event.target.value,
              })
            }
          />

          {value.customName.trim() && domain && (
            <p
              style={{
                ...supportingTextStyle,
                marginTop: 8,
              }}
            >
              Sender address:{" "}
              <strong>
                {value.customName.trim()}@{domain}
              </strong>
            </p>
          )}
        </div>
      )}

      {value.mode === 'company' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap:12,
          }}
        >
          <Input
            label="Search company users"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={userLoading}
          />

          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            {userLoading ? (
              <p style={{ ...supportingTextStyle, padding: 12 }}>
                Loading users...
              </p>
            ) : filteredUsers.length === 0 ? (
              <p style={{ ...supportingTextStyle, padding: 12 }}>
                No users found.
              </p>
            ) : (
              filteredUsers.map((user) => (
                <label
                  key={user.auth0Id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderBottom: '1px solid var(--border)',
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="spoofed-sender"
                    checked={value.senderAuth0Id === user.auth0Id}
                    onChange={() =>
                      onChange({
                        ...value,
                        senderAuth0Id: user.auth0Id,
                      })
                    }
                  />

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {user.name}
                    </div>

                    <div style={supportingTextStyle}>
                      {user.email}
                      {user.department && ` - ${user.department}`}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          {selectedUser && (
            <p style={supportingTextStyle}>
              Selected sender:{" "}
              <strong>{selectedUser.name}</strong>
            </p>
          )}
        </div>
      )}

      <Input
        label="Display name (optional)"
        placeholder="e.g. IT Support"
        value={value.alias}
        onChange={(event) =>
          onChange({
            ...value,
            alias: event.target.value,
          })
        }
      />
    </div>
  );
}