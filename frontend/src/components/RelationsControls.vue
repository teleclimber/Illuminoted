<script setup lang="ts">
import {computed, Ref } from 'vue';
import { useNoteEditorStore } from '../stores/note_editor';

import type { Note } from '../stores/graph';
import RelationIcon from './RelationIcon.vue';

const noteEditorStore = useNoteEditorStore();

const props = defineProps<{
	note: Ref<Note>,
}>();

type RelState = {
	desc: string,
	on: boolean,
	disabled: boolean
}

const rels = computed( () => {
	const thread_out = noteEditorStore.rel_edit.find( d => d.label === 'thread-out' && d.note_id === props.note.value.id );
	const rels : Record<string,RelState> = {
		//'thread-out':	{desc: 'Thread out',	on: false},
		'in-reply-to':	{desc: 'Reply',			on: false, disabled: !!thread_out },
		'see-also':		{desc: 'See also',		on: false, disabled: !!thread_out }
	};
	noteEditorStore.rel_edit.forEach( d => {
		if( rels[d.label] && d.note_id === props.note.value.id && d.action !== 'delete' ) rels[d.label].on = true;
	});
	return rels;
});

function getClasses(r:RelState) :string[] {
	if( r.disabled ) {
		if( r.on ) return ['bg-neutral-300', 'border-top-neutral-400'];
		else return ['bg-neutral-300'];
	}
	else {
		if( r.on ) return ['bg-sky-500', 'hover:bg-sky-400', 'border-t-sky-600', 'border-b-sky-400'];
		else return ['bg-sky-600', 'hover:bg-sky-500', 'border-t-sky-400', 'border-b-sky-800'];
	}
}

function relClicked(label:string) {
	const rel = rels.value[label];
	noteEditorStore.editRelation(props.note.value.id, label, !rel.on);
}

</script>

<template>
	<div class="" v-if="props.note.value.created.getTime() < noteEditorStore.created_time">
		<div class="flex">
			<button v-for="r, label in rels" class="px-2 py-2 ml-1 flex-shrink-0 flex flex-col items-center text-sm uppercase rounded-lg text-white border-y-2" 
				:class="getClasses(r)"
				:disabled="r.disabled"
				@click.stop.prevent="relClicked(label)">
				<RelationIcon :label="label" class="h-5 w-5"></RelationIcon>
				{{r.desc}}
			</button>
		</div>
	</div>
	<div v-else-if="note.value.id !== noteEditorStore.edit_note_id" class="bg-slate-400 text-white px-2 rounded-full text-sm whitespace-nowrap">Note is after edited</div>
</template>