<script setup lang="ts">
import { ref, Ref, computed, onMounted } from 'vue';
import { useUIStateStore } from '../stores/ui_state';
import { Thread, useThreadsStore } from '../stores/threads';

const uiStateStore = useUIStateStore();
const threadsStore = useThreadsStore();

const threads_sel = computed( () => {
	const ret :Thread[] = []; 
	uiStateStore.selected_threads.forEach( thread_id => {
		if( uiStateStore.show_edit_thread !== undefined 
			&& uiStateStore.show_edit_thread !== thread_id
			&& !isDescendant(uiStateStore.show_edit_thread, thread_id)) {
			ret.push(threadsStore.mustGetThread(thread_id));
		}
	});
	if( og_parent_id.value !== null && !ret.find( t => t.id === og_parent_id.value) ) {
		ret.unshift(threadsStore.mustGetThread(og_parent_id.value));
	}
	console.log(ret)
	return ret;
});

function isDescendant(id :number, test_id :number) :boolean {
	let t :number|null = test_id;
	while( t !== null ) {
		const thread = threadsStore.mustGetThread(t);
		t = thread.parent;
		if( t === id ) return true;
	}
	return false;
}

const thread_name = ref("");

// use selected threads to populate a dropdown of threads for reparenting.
// for each you have to go up the parent sequence to check none are the thread being edited

const parent_id :Ref<number|null> = ref(null);
const og_parent_id :Ref<number|null> = ref(null);

onMounted( () => {
	if( uiStateStore.show_edit_thread === undefined ) {
		parent_id.value = null;
		og_parent_id.value = null;
		thread_name.value = "";
		return;
	}
	const thread = threadsStore.mustGetThread(uiStateStore.show_edit_thread);
	parent_id.value = thread.parent;
	og_parent_id.value = thread.parent;
	thread_name.value = thread.name;
});

function save() {
	if( uiStateStore.show_edit_thread === undefined ) return;
	if( parent_id.value === null ) return;	// This prevents the root not from being edited.
	try {
		threadsStore.updateThread(uiStateStore.show_edit_thread, parent_id.value, thread_name.value );
	}
	catch(e) {
		console.error(e);
		alert("Error. See console.");
		return;
	}
	uiStateStore.closeEditThread();
}

const btn_classes = ['border-y-2', 'bg-sky-600', 'hover:bg-sky-500',
	'border-b-sky-800', 'border-t-sky-400', 
	'disabled:bg-gray-400', 'disabled:border-gray-400', 'text-gray-200',
	'text-white',  'text-xs', 'font-medium', 'uppercase', 'rounded'];

</script>

<template>
	<div class="p-2 bg-gray-200 border-t-2">
		<p  class="italic text-amber-800 ">
			Parent:
			<select v-model="parent_id" class="px-2 py-1 border bg-white">
				<option v-for="thread in threads_sel" :value="thread.id">{{ thread.name }}</option>
			</select>
		</p>
		<p class="my-1 flex">
			Thread Name:
			<input type="text" 
				v-model="thread_name" ref="thread_name_input"
				class="border mx-1" />
		</p>
		<div class="flex justify-between">
			<button @click="uiStateStore.closeEditThread()" class="px-3 py-1" :class="btn_classes">cancel</button>
			<button @click="save" :class="btn_classes" class="px-3 py-1">save</button>
		</div>
	</div>
</template>