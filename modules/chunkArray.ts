const chunkArray = (inputArray: any[], perChunk: number) => {
  return inputArray.reverse().reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk)

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].unshift(item)

    return resultArray
  }, [])
}

export default chunkArray;