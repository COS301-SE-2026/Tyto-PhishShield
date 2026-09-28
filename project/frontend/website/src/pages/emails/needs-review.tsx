import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import{
  ClipboardCheck,
  RefreshCw,
  Paperclip,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { getNeedsReviews, resolveReview, deleteReview, type ReviewListItem, type ReviewDecision, type Severity } from '../../services/needs-review';

interface NeedsReviewProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

type BadgeVariant = 'success' | 'warning' |'danger';

function getSeverityVariant(severity?: Severity): BadgeVariant {
  switch (severity) {
    case 'high':
    case 'critical':
      return 'danger';

    case 'medium':
      return 'warning';

    default:
      return 'success';
  }
}

function formatLabel(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const sectionHeadingStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 8,
  color: 'var(--text-primary)',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const sectionTextStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--text-secondary)',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const detailLabelStyle: CSSProperties = {
  marginBottom: 5,
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
};

const detailValueStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--text-primary)',
  overflowWrap: 'anywhere',
};

export function NeedsReview({
  onNavigate,
  activePath,
}: NeedsReviewProps) {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);

  const selectedReview = reviews.find((review) => review.id === selectedId)?? null;

  const fetchReviews = useCallback(
    async (showLoading = false): Promise<void> => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const result = await getNeedsReviews();

        setLastFetchedAt(Date.now());
        setReviews(result);

        setSelectedId((previous) => {
          if (previous && result.some((review) => review.id === previous)) {
            return previous;
          }

          return result[0]?.id ?? null;
        });
      } catch (error) {
        console.error(error);

        addToast({
          type: 'error',
          title: 'Could not load reviews',
          message: error instanceof Error ? error.message: 'Pending reviews could not be retrieved',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    void fetchReviews(true);
  }, [fetchReviews]);

  const handleResolve = async (decision: ReviewDecision): Promise<void> => {
    if (!selectedReview || processing) {
      return;
    }

    const reviewId = selectedReview.id;
    setProcessing(true);

    try {
      await resolveReview(reviewId, decision);
      const remaining = reviews.filter((review) => review.id !== reviewId);

      setReviews(remaining);
      setSelectedId(remaining[0]?.id ?? null);

      addToast({
        type: 'success',
        title: 'Review resolved',
        message: decision === 'leak' ? 'The review was confirmed as a leak.' : 'The review was resolved as containing no leaks,'
      });
    } catch (error) {
      console.error(error);

      addToast({
        type: 'error',
        title: 'Could not resolve review',
        message: error instanceof Error ? error.message : 'The review could not be Resolved.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedReview || processing) {
      return;
    }

    const reviewId = selectedReview.id;
    setProcessing(true);

    try {
      await deleteReview(reviewId);

      const remaining = reviews.filter((review) => review.id !== reviewId);

      setReviews(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      addToast({
        type: 'success',
        title: 'Review Deleted',
        message: 'The review was deleted successfully'
      });
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: 'Could not delete review',
        message: error instanceof Error ? error.message : 'The review could not be deleted',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Needs Review"
      subtitle="Review employee replies that were flagged during phishing simulations"
      breadcrumbs={[
        {
          label: 'Emails',
          path: '/emails',
        },
        {
          label: 'Needs Review',
        },
      ]}
    >
      <div
        style={{
            gap: 24,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 1200,
        }}
      >
        <Card style={{ padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h2 style={sectionHeadingStyle}>
                Pending Reviews
              </h2>

              <p style={sectionTextStyle}>
                Review flagged replies and determine whether
                sensitive information was leaked.
              </p>

              {!loading && (
                <div style={{ marginTop: 12 }}>
                  <Badge variant="warning">
                    {reviews.length} Pending
                  </Badge>
                </div>
              )}
            </div>

            <Button
                variant="ghost"
                loading={refreshing}
                disabled={loading || refreshing || processing}
                onClick={() => void fetchReviews()}
            >
                <RefreshCw size={15} />
                Refresh
            </Button>
          </div>
        </Card>

        {loading ? (
          <Card style={{ padding: 32 }}>
            <p style={sectionTextStyle}>
              Loading all pending reviews...
            </p>
          </Card>
        ) : reviews.length === 0 ? (
          <Card
            style={{
              padding: 48,
              textAlign: 'center',
            }}
          >
            <h2 style={sectionHeadingStyle}>
                No Pending Reviews
            </h2>

            <p style={sectionTextStyle}>
                There are currently no employee replies awaiting review.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <Card style={{ padding: 24 }}>
              <h2 style={sectionHeadingStyle}>
                    Review Queue
              </h2>

              <p
                style={{
                  ...sectionTextStyle,
                  marginBottom: 16,
                }}
              >
                Select a review to see its details.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {reviews.map((review) => {
                  const selected = review.id === selectedId;

                  return (
                    <button
                      key={review.id}
                      type="button"
                      disabled={processing}
                      onClick={() => setSelectedId(review.id)}
                      style={{
                        width: '100%',
                        padding: 16,
                        textAlign: 'left',
                        borderRadius: 8,
                        border: selected ? '1.5px solid var(--color-primary)': '1px solid var(--border)',
                        background: selected ? 'var(--bg-hover)' : 'var(--bg-input)',
                        cursor: processing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {review.user?.name ?? review.user?.email ?? 'Unknown employee'}
                        </span>

                        <Badge
                          variant={getSeverityVariant(review.severity)}
                        >
                          {review.severity ? formatLabel(review.severity) : 'Unclassified'}
                        </Badge>

                      </div>
                      <p
                        style={{
                          ...sectionTextStyle,
                          marginBottom: 8,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {review.subject ?? 'No subject'}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          justifyContent: 'space-between',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={detailLabelStyle}>
                          {formatLabel(review.reviewType)}
                        </span>

                        <span style={detailLabelStyle}>
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

            </Card>
            {selectedReview && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  minWidth: 0,
                }}
              >
                <Card style={{ padding: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <h2 style={sectionHeadingStyle}>
                        Review Details
                    </h2>

                    <Badge
                      variant={getSeverityVariant(selectedReview.severity)}
                    >
                      {selectedReview.severity ? formatLabel(selectedReview.severity): 'Unclassified' }
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    {[
                      {
                        label: 'Employee',
                        value: selectedReview.user?.name ?? selectedReview.user?.email ??'Unknown Employee',
                      },
                      {
                        label: 'Email',
                        value: selectedReview.user?.email ?? 'Unavailable',
                      },
                      {
                        label: 'Department',
                        value: selectedReview.user?.department ?? 'Unavailable',
                      },
                      {
                        label: 'Subject',
                        value: selectedReview.subject ?? 'No subject',
                      },
                      {
                        label: 'Review Type',
                        value: formatLabel(selectedReview.reviewType),
                      },
                      {
                        label: 'Submitted',
                        value: formatDate(selectedReview.createdAt,),
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <p style={detailLabelStyle}>
                          {item.label}
                        </p>
                        <p style={detailValueStyle}>
                          {item.value}
                        </p>

                      </div>
                    ))}
                    <div>
                      <p style={detailLabelStyle}>
                        Flagged Categories
                      </p>
                      {selectedReview.categories?.length ? (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          {selectedReview.categories.map(
                            (category) => (
                              <Badge
                                key={category}
                                variant="warning"
                              >
                                {formatLabel(category)}
                              </Badge>
                            ),
                          )}
                        </div>
                      ) : (
                        <p style={detailValueStyle}>
                          None provided
                        </p>
                      )}
                    </div>
                    {selectedReview.confidence !== undefined && (
                      <div>
                        <p style={detailLabelStyle}>
                          Classification Confidence
                        </p>
                        <p style={detailValueStyle}>
                          {selectedReview.confidence}
                        </p>
                      </div>

                    )}
                  </div>
                </Card>

                <Card style={{ padding: 24 }}>
                  <h2 style={sectionHeadingStyle}>
                    Employee Reply
                  </h2>

                  <p
                    style={{
                      ...sectionTextStyle,
                      marginBottom: 16,
                    }}
                  >
                    Review the employee's reply and make a decision.
                  </p>

                  <div
                    style={{
                      padding: 16,
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedReview.body?? 'No reply content available.'}
                  </div>
                </Card>

                <Card style={{ padding: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}
                  >
                    <Paperclip
                      size={16}
                      style={{
                        color: 'var(--color-primary)',
                      }}
                    />
                    <h2
                      style={{
                        ...sectionHeadingStyle,
                        marginBottom: 0,
                      }}
                    >
                      Attachments
                    </h2>
                  </div>

                  <p
                    style={{
                      ...sectionTextStyle,
                      marginBottom: 16,
                    }}
                  >
                    Attachments may contain sensitive
                    information. Download only when necessary.
                  </p>

                  {selectedReview.attachments.length === 0 ? (
                    <p style={sectionTextStyle}>
                      No attachments are available.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {selectedReview.attachments.map(
                        (attachment) => {
                          const expired =
                            new Date(attachment.expiresAt).getTime() <=
                            lastFetchedAt;

                          return (
                            <div
                              key={attachment.id}
                              style={{
                                padding: 14,
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 12,
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    ...detailValueStyle,
                                    fontWeight: 600,
                                  }}
                                >
                                  {attachment.filename}
                                </p>

                                <p style={detailLabelStyle}>
                                  {formatFileSize(attachment.size)}
                                  {' · '}
                                  {attachment.contentType}
                                </p>
                              </div>

                              {expired ? (
                                <span
                                  style={{
                                    ...sectionTextStyle,
                                    color: 'var(--color-danger)',
                                  }}
                                >
                                  Link expired. Refresh reviews.
                                </span>
                              ) : (
                                <a
                                  href={attachment.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--color-primary)',
                                  }}
                                >
                                  Download
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </Card>
                <Card style={{ padding: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <ClipboardCheck
                      size={18}
                      style={{
                        color: 'var(--color-primary)',
                      }}
                    />
                    <h2
                      style={{
                        ...sectionHeadingStyle,
                        marginBottom: 0,
                      }}
                    >
                      Review Decision
                    </h2>
                  </div>

                  <p
                    style={{
                      ...sectionTextStyle,
                      marginBottom: 16,
                    }}
                  >
                    Confirm whether the employee's reply
                    contains leaked information.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <Button
                      disabled={processing}
                      loading={processing}
                      onClick={() =>
                        void handleResolve('leak')
                      }
                    >
                      <AlertTriangle size={15} />
                      Confirm Leak
                    </Button>

                    <Button
                      variant="ghost"
                      disabled={processing}
                      onClick={() =>
                        void handleResolve('no_leak')
                      }
                    >
                      <CheckCircle2 size={15} />
                      No Leak
                    </Button>

                    <Button
                      variant="ghost"
                      disabled={processing}
                      onClick={() => void handleDelete()}
                      style={{
                        color: 'var(--color-danger)',
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}