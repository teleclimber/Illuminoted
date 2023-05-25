<script setup lang="ts">
import {computed} from 'vue';
import { useNotesGraphStore } from './models/graph';
import { usePageControlStore } from './page_control';

import NoteStack from './components/NoteStack.vue';
import ThreadUI from './components/Thread.vue';
import NoteControls from './components/NoteControls.vue';
import NoteEditor from './components/NoteEditor.vue';
import SearchBox from './components/SearchBox.vue';

const notesStore = useNotesGraphStore();
const pageStore = usePageControlStore();

const show_threads = computed( () => pageStore.show_threads );

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
	<header v-if="!show_threads && notesStore.context_thread" class="sticky h-10 justify-between flex items-center top-0 z-50 bg-gray-100">
		<button class="px-2 h-8 overflow-y-hidden hover:bg-gray-50" @click="pageStore.showThreads()">{{notesStore.context_thread.contents}}</button>
		<SearchBox v-if="pageStore.show_search" class="mr-4"></SearchBox>
		<button v-else @click="pageStore.showSearch()" class="px-6 py-2 hover:bg-gray-50">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
			</svg>
		</button>
		
	</header>

	<div class="bg-gray-100 pb-4" v-if="notesStore.context_thread && show_threads">
		<div @click="pageStore.hideThreads()" class="absolute right-0 top-0 p-4">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 0zm0-6a1 1 0 010-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
			</svg>
		</div>
		
		<ThreadUI  :thread="notesStore.context_thread" :is_root="true"></ThreadUI>

		<p class="pt-10 px-2 text-sm text-gray-500">
			Icon from: <a class="text-blue-400 underline" href="https://www.flaticon.com/free-stickers/creativity" title="creativity stickers">Creativity stickers by Stickers - Flaticon</a>.
		</p>
	</div>
	
	<NoteStack v-if="!show_threads"></NoteStack>

	<div v-if="!show_threads" class="sticky bottom-0 z-50">
		<NoteControls></NoteControls>
		<NoteEditor></NoteEditor>
	</div>
	
      
</template>
