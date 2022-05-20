<script setup lang="ts">
import {ref, Ref, onMounted, computed} from 'vue';
import NoteUI from './components/Note.vue';
import ThreadUI from './components/Thread.vue';

import {NotesGraph} from './models/graph';
import type {Note, NoteData, Thread} from './models/graph';

export interface UINote {
  note: Note,
  thread: Thread,
  prev: UINote|undefined,
  next: UINote|undefined, 
}

const notes_graph = new NotesGraph;

onMounted( async () => {
  notes_graph.getThreads();
  notes_graph.getLatestNotes();
});



async function threadClicked(thread:number) {
  notes_graph.setThread(thread);
}


const ui_notes = computed( () => {
  let prev :UINote|undefined;
  return notes_graph.notes.value.map( n => {
    
    const ui_note :UINote = {
      note:n,
      thread: notes_graph.mustGetThread(n.thread),
      prev: prev,
      next: undefined, 
    };
    if( prev ) prev.next = ui_note;
    prev = ui_note;
    return ui_note;
  });
});



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
  
  <div class="px-4">
    <h2 class="text-xl font-bold">Threads: ({{ notes_graph.threads.value.length }})</h2>
    <ThreadUI :thread="thread" v-for="thread in notes_graph.threads.value" v-on:thread-clicked="threadClicked"></ThreadUI>
  </div>

  <div class="px-4">
    <h2 class="text-xl font-bold">Notes:</h2>
    <NoteUI :ui_note="note" v-for="note in ui_notes"></NoteUI>
  </div>
</template>
