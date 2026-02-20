import type { CommentDTO, UserDTO } from '@tsuki/shared/dto'
import CommentItem from './CommentItem'

interface CommentListProps {
  comments: CommentDTO[]
  currentUser: UserDTO | null
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

/** Build a tree from flat comment list using parent_id */
function buildTree(comments: CommentDTO[]): Map<string | null, CommentDTO[]> {
  const tree = new Map<string | null, CommentDTO[]>()
  for (const comment of comments) {
    const parentId = comment.parent_id
    const children = tree.get(parentId) ?? []
    children.push(comment)
    tree.set(parentId, children)
  }
  return tree
}

function CommentTreeNode({
  comment,
  tree,
  currentUser,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: CommentDTO
  tree: Map<string | null, CommentDTO[]>
  currentUser: UserDTO | null
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}) {
  const children = tree.get(comment.id) ?? []

  return (
    <CommentItem
      comment={comment}
      currentUser={currentUser}
      onReply={onReply}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {children.length > 0 && (
        <ul className="comment-list-nested">
          {children.map((child) => (
            <CommentTreeNode
              key={child.id}
              comment={child}
              tree={tree}
              currentUser={currentUser}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </CommentItem>
  )
}

export default function CommentList({
  comments,
  currentUser,
  onReply,
  onEdit,
  onDelete,
}: CommentListProps) {
  const tree = buildTree(comments)
  const rootComments = tree.get(null) ?? []

  if (rootComments.length === 0) {
    return <div className="comment-empty">还没有评论，来说两句吧</div>
  }

  return (
    <ul className="comment-list">
      {rootComments.map((comment) => (
        <CommentTreeNode
          key={comment.id}
          comment={comment}
          tree={tree}
          currentUser={currentUser}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
