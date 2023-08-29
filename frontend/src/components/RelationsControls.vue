<script setup lang="ts">
import {computed, Ref, toRefs } from 'vue';
import { useNoteEditorStore } from '../stores/note_editor';

import type { Note } from '../stores/graph';
import RelationIcon from './RelationIcon.vue';

const noteEditorStore = useNoteEditorStore();

const props = defineProps<{
		note: Ref<Note>,
	}>();
const {note} = toRefs(props);

type RelState = {
	desc: string,
	on: boolean,
	disabled: boolean
}

const rels = computed( () => {
	const thread_out = noteEditorStore.rel_edit.find( d => d.label === 'thread-out' && d.note_id === note.value.id );
	const rels : Record<string,RelState> = {
		//'thread-out':	{desc: 'Thread out',	on: false},
		'in-reply-to':	{desc: 'Reply',			on: false, disabled: !!thread_out },
		'see-also':		{desc: 'See also',		on: false, disabled: !!thread_out }
	};
	noteEditorStore.rel_edit.forEach( d => {
		if( rels[d.label] && d.action !== 'delete' ) rels[d.label].on = true;
	});
	return rels;
});

function getClasses(r:RelState) :string[] {
	if( r.disabled ) {
		if( r.on ) return ['bg-neutral-300','border-2', 'border-top-neutral-400'];
		else return ['bg-neutral-300'];
	}
	else {
		if( r.on ) return ['bg-blue-400', 'hover:bg-blue-500', 'border-t-2', 'border-blue-500'];
		else return ['bg-blue-600', 'hover:bg-blue-700'];
	}
}

function relClicked(label:string) {
	const rel = rels.value[label];
	noteEditorStore.editRelation(note.value.id, label, !rel.on);
}

</script>

<template>
	<div class="px-4 py-4" v-if="note.created.getTime() < noteEditorStore.created_time">
		<div class="flex">
			<button v-for="r, label in rels" class="px-2 py-2 ml-1 mt-2 flex-shrink-0 flex flex-col items-center bg-blue-600 text-sm uppercase rounded-lg text-white " 
				:class="getClasses(r)"
				:disabled="r.disabled"
				@click.stop.prevent="relClicked(label)">
				<RelationIcon :label="label" class="h-5 w-5"></RelationIcon>
				{{r.desc}}
			</button>
		</div>
	</div>
	<div v-else-if="note.id !== noteEditorStore.edit_note_id" class="bg-slate-400 text-white px-2 rounded-full text-sm whitespace-nowrap">Note is after edited</div>
</template>