<script setup lang="ts">
import {computed} from 'vue';
import { useUIStateStore } from './models/ui_state';
import { useNoteEditorStore } from './note_editor';
import { useNoteStackStore } from './models/note_stack';

import NoteStack from './components/NoteStack.vue';
import ThreadStack from './components/ThreadStack.vue';
import NoteControls from './components/NoteControls.vue';
import NoteEditor from './components/NoteEditor.vue';
import ThreadEditor from './components/ThreadEditor.vue';
import SearchBox from './components/SearchBox.vue';
import TimeBar from './components/TimeBar.vue';

const uiStateStore = useUIStateStore();
const noteEditorStore = useNoteEditorStore();

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

const notes_left = computed( () => {
	if( uiStateStore.pin_threads && uiStateStore.show_threads ) return uiStateStore.threads_width;
	return 0;
});

</script>

<template>
	<!-- <header v-if="!show_threads && context_thread" class="sticky h-10 justify-between flex items-center top-0 z-50 bg-gray-100">
		<button class="px-2 h-8 overflow-y-hidden hover:bg-gray-50" @click="uiStateStore.showThreads()">{{context_thread.name}}</button>
		<SearchBox v-if="uiStateStore.show_search" class="mr-4"></SearchBox>
		<button v-else @click="uiStateStore.showSearch()" class="px-6 py-2 hover:bg-gray-50">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
			</svg>
		</button>
		
	</header> -->
		
		<ThreadStack></ThreadStack>

		<div v-if="!uiStateStore.show_search" class="absolute top-2 z-20 right-2">
			<button @click="uiStateStore.showSearch()"
				class="py-1 px-2 border border-gray-700 text-gray-700 rounded-lg bg-gray-50 hover:bg-yellow-50">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
				</svg>
			</button>
		</div>

		<SearchBox v-if="uiStateStore.show_search" class="z-20"></SearchBox>

		<div class="h-full flex flex-col" :style="'padding-left:'+notes_left+'px; padding-right: 50px'">
			
			<NoteStack ></NoteStack>

			<div class="z-10">
				<NoteControls></NoteControls>
				<NoteEditor v-if="noteEditorStore.show"></NoteEditor>
				<ThreadEditor v-if="uiStateStore.show_edit_thread"></ThreadEditor>
			</div>
		</div>

		<TimeBar></TimeBar>

</template>

<style>
html, body {
	height: 100%;
}
</style>