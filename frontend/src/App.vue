<script setup lang="ts">
import {notes_graph} from './main';

import NoteStack from './components/NoteStack.vue';
import ThreadUI from './components/Thread.vue';
import NoteEditor from './components/NoteEditor.vue';


// Some UI use cases:
// - authoring
//   - Limit to scope of work
//     - "pinned" threads that are relevant, like "dropserver and all descendents", Vue, Golang, sqlite, ...
//     - scope changes over time
//     - wonder if this is all done via relations, or if there is another "project" thing?
//   - Need quick access to relevant threads to be able to make additions in the right places
//     - need search-for-thread
//   - Thread view to append to thread
// - Looking at/for

// Navigation and URLS:
// - url path is the context node: notes.me.com/2  <- context of root node of 2
// - imagine that adding joined contexts and ignore lists also possible
// - Also current "view", because there is a lot more than context involved.

// clicking around on notes and threads...
// - click on thread -> show the thread's notes and descendents / outbound relations
// - click on a note: ?
// - click on <link icon> on thread: change context (ie root thread of whatever project you're interest in)
// the parameters that define the view:
// - context root thread
// - currently selected thread
// - some scroll indication, like created date of currently visible notes?

</script>

<template>
  <header class="sticky top-0 z-50 bg-gray-100">
  
    <div class="px-2">
      <ThreadUI v-if="notes_graph.context_thread.value" :thread="notes_graph.context_thread.value" :is_root="true"></ThreadUI>
    </div>
  </header>
  
  <NoteStack></NoteStack>

  <NoteEditor class="sticky bottom-0 z-50"></NoteEditor>
      
</template>
