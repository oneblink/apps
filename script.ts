import { downloadPreFillFormData } from './src/services/api/prefill'

const fn = async () => {
  const result = await downloadPreFillFormData(1, '')
  console.log(result)
}

fn()
