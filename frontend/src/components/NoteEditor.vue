<script setup lang="ts">
import {ref, computed } from 'vue';
import { notes_graph, note_editor } from '../main';

const parent = computed( () => {
	if( !note_editor.parent_id.value ) return undefined;
	return notes_graph.mustGetNote(note_editor.parent_id.value);
});
const thread = note_editor.thread;
const contents = note_editor.contents;

const saving = ref(false);
async function saveNote() {
	saving.value = true;
	await note_editor.saveNote();
	saving.value = false;

	// after that, maybe pre-select the last or newest thread to follow on?
}
function reset() {
	if( !saving.value ) note_editor.reset();
}

</script>

<template>
	<div v-if="note_editor.has_data.value" class="p-2 bg-white border-t-2">
		<p v-if="thread" class="italic text-amber-800 max-w-prose whitespace-nowrap overflow-clip">Thread: {{thread.contents}}</p>
		<p v-else-if="parent" class="whitespace-nowrap overflow-clip">Threading out: {{parent.contents}} </p>
		<p v-else>{{note_editor.rel.value}}</p>

		<div>
			<textarea v-model="contents" class="w-full h-32 border"></textarea>
		</div>

		<div>
			<!-- links to other notes ... -->
		</div>
		
		<div class="flex justify-between">
			<button
				class="bg-blue-600 text-white px-4 py-2 text-sm uppercase rounded disabled:bg-gray-200"
				:disabled="saving"
				@click.stop.prevent="reset()">Cancel</button>
			<button 
				class="bg-blue-600 text-white px-4 py-2 text-sm uppercase rounded"
				@click.stop.prevent="saveNote()">Save</button>
		</div>
	</div>

</template>