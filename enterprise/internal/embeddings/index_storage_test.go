package embeddings

import (
	"bytes"
	"context"
	"io"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/sourcegraph/sourcegraph/internal/api"
	"github.com/sourcegraph/sourcegraph/internal/uploadstore"
	"github.com/sourcegraph/sourcegraph/lib/errors"
)

type mockUploadStore struct {
	files map[string][]byte
}

func newMockUploadStore() uploadstore.Store {
	return &mockUploadStore{files: map[string][]byte{}}
}

func (s *mockUploadStore) Init(ctx context.Context) error {
	return nil
}

func (s *mockUploadStore) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	file, ok := s.files[key]
	if !ok {
		return nil, errors.Newf("file %s not found", key)
	}
	return io.NopCloser(bytes.NewReader(file)), nil
}

func (s *mockUploadStore) Upload(ctx context.Context, key string, r io.Reader) (int64, error) {
	file, err := io.ReadAll(r)
	if err != nil {
		return -1, errors.Newf("error reading file %s", key)
	}
	s.files[key] = file
	return int64(len(file)), nil
}

func (s *mockUploadStore) Compose(ctx context.Context, destination string, sources ...string) (int64, error) {
	return 0, nil
}

func (s *mockUploadStore) Delete(ctx context.Context, key string) error {
	return nil
}

func (s *mockUploadStore) ExpireObjects(ctx context.Context, prefix string, maxAge time.Duration) error {
	return nil
}

func TestEmbeddingIndexStorage(t *testing.T) {
	index := &RepoEmbeddingIndex{
		RepoName: api.RepoName("repo"),
		Revision: api.CommitID("commit"),
		CodeIndex: &EmbeddingIndex[RepoEmbeddingRowMetadata]{
			Embeddings:      []float32{0.0, 0.1, 0.2},
			ColumnDimension: 3,
			RowMetadata:     []RepoEmbeddingRowMetadata{{FileName: "a.go", StartLine: 0, EndLine: 1}},
		},
		TextIndex: &EmbeddingIndex[RepoEmbeddingRowMetadata]{
			Embeddings:      []float32{1.0, 2.1, 3.2},
			ColumnDimension: 3,
			RowMetadata:     []RepoEmbeddingRowMetadata{{FileName: "b.py", StartLine: 0, EndLine: 1}},
		},
	}

	ctx := context.Background()
	uploadStore := newMockUploadStore()

	err := UploadIndex(ctx, uploadStore, "index", index)
	require.NoError(t, err)

	downloadedIndex, err := DownloadIndex[RepoEmbeddingIndex](ctx, uploadStore, "index")
	require.NoError(t, err)

	require.Equal(t, index, downloadedIndex)
}