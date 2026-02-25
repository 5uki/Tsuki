import { useMemo } from 'react'
import type { CommentDTO, UserDTO } from '@tsuki/shared/dto'
import CommentItem from './CommentItem'
import type { CommentItemI18n } from './CommentItem'

interface CommentListProps {
  comments: CommentDTO[]
  currentUser: UserDTO | null
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  i18n?: CommentItemI18n
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
  i18n,
}: {
  comment: CommentDTO
  tree: Map<string | null, CommentDTO[]>
  currentUser: UserDTO | null
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  i18n?: CommentItemI18n
}) {
  const children = tree.get(comment.id) ?? []

  return (
    <CommentItem
      comment={comment}
      currentUser={currentUser}
      onReply={onReply}
      onEdit={onEdit}
      onDelete={onDelete}
      i18n={i18n}
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
              i18n={i18n}
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
  i18n,
}: CommentListProps) {
  const tree = useMemo(() => buildTree(comments), [comments])
  const rootComments = tree.get(null) ?? []

  if (rootComments.length === 0) {
    return null
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
          i18n={i18n}
        />
      ))}
    </ul>
  )
}
