import { RequireAuth } from '../../components/RequireAuth'
import { ChatScreen } from '../../screens/ChatScreen'

export default function ChatRoute() {
  return <RequireAuth><ChatScreen /></RequireAuth>
}
