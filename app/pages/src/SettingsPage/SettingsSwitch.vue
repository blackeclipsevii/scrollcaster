<!-- src/pages/MyPage.vue -->
<template>
    <label>
        <label class="switch upgrade-label">
            <input type="checkbox" class="upgrade-checkbox" :checked="modelValue" @click="toggle">
            <span class="slider round"></span>
        </label>
    </label>
</template>

<script setup lang="ts">
    defineProps<{ modelValue: boolean }>()

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void
    }>()

    function toggle(event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        emit('update:modelValue', isChecked)
    }
</script>

<style scoped>
    .switch {
        width: 3.5em;
        min-width: 3.5em;
        height: 2em;
    }

    .slider::before {
        width: 1.60em;
        height: 1.60em;
        left: .20em;
        bottom: .21em;
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(1.5em);
        -ms-transform: translateX(1.5em);
        transform: translateX(1.5em);
    }
</style>
