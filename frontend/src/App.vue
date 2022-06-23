<script setup lang="ts">
import {computed} from 'vue';
import {notes_graph, page_control} from './main';

import NoteStack from './components/NoteStack.vue';
import ThreadUI from './components/Thread.vue';
import NoteControls from './components/NoteControls.vue';
import NoteEditor from './components/NoteEditor.vue';

const show_threads = computed( () => page_control.show_threads.value );

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

const filter_tread = computed( () => {
	if( page_control.filter_thread.value === page_control.context_id.value ) return;
	return notes_graph.getThread(page_control.filter_thread.value);
});

</script>

<template>
	<header v-if="!show_threads && notes_graph.context_thread.value" class="sticky top-0 z-50 px-2 by-2 bg-gray-100 flex flex-col flex-nowrap md:flex-row" @click="page_control.showThreads()">
		<div class="h-6 overflow-y-hidden">{{notes_graph.context_thread.value.contents}}</div>
		<div v-if="filter_tread" class="h-6 overflow-y-hidden flex">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
			</svg>
			{{filter_tread.contents}}
		</div>
	</header>

	<div class="bg-gray-100 pb-4" v-if="notes_graph.context_thread.value && show_threads">
		<div @click="page_control.hideThreads()" class="flex justify-center py-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 0zm0-6a1 1 0 010-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
			</svg>
		</div>
		
		<ThreadUI  :thread="notes_graph.context_thread.value" :is_root="true"></ThreadUI>
	</div>
	
	<NoteStack v-if="!show_threads"></NoteStack>

	<div class="sticky bottom-0 z-50">
		<NoteControls></NoteControls>
		<NoteEditor v-if="!show_threads"></NoteEditor>
	</div>
	
      
</template>
